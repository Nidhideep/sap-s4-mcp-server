import { z } from "zod";
import { getAuthHeaders, fetchCsrfToken, s4Url } from "../config/auth.js";
import { env } from "../config/env.js";
import { enforceWritePolicy, auditLog } from "../config/policy.js";

export const ExecuteODataQueryInputSchema = z.object({
  service: z
    .string()
    .describe("OData service name, e.g. API_BUSINESS_PARTNER"),
  entity: z
    .string()
    .describe("Entity set name, e.g. A_BusinessPartner"),
  method: z
    .enum(["GET", "POST", "PATCH", "DELETE"])
    .optional()
    .default("GET")
    .describe("HTTP method — GET reads (returns CSV), POST creates, PATCH updates, DELETE removes"),
  entityKey: z
    .string()
    .optional()
    .describe(
      "Key predicate for a single-record operation, e.g. \"'1000001'\" or \"BusinessPartner='1000001'\""
    ),
  filter: z
    .string()
    .optional()
    .describe("OData $filter expression, e.g. \"BusinessPartnerCategory eq '1'\""),
  select: z
    .array(z.string())
    .optional()
    .describe("Fields to return, e.g. [\"BusinessPartner\", \"BusinessPartnerFullName\"]"),
  top: z
    .number()
    .int()
    .positive()
    .optional()
    .default(100)
    .describe("Maximum rows to return for GET requests (default 100)"),
  skip: z
    .number()
    .int()
    .nonnegative()
    .optional()
    .describe("Rows to skip for GET pagination"),
  orderBy: z
    .string()
    .optional()
    .describe("OData $orderby expression, e.g. \"BusinessPartner asc\""),
  payload: z
    .record(z.unknown())
    .optional()
    .describe("Request body for POST and PATCH operations"),
});

export type ExecuteODataQueryInput = z.infer<typeof ExecuteODataQueryInputSchema>;

export interface ExecuteODataQueryResult {
  content: string;
  rowCount?: number;
}

function buildUrl(input: ExecuteODataQueryInput): string {
  const keySegment = input.entityKey ? `(${input.entityKey})` : "";
  const base = `/sap/opu/odata/sap/${input.service}/${input.entity}${keySegment}`;

  if (input.method !== "GET") return s4Url(base);

  const params = new URLSearchParams({ $format: "json" });
  if (input.filter) params.set("$filter", input.filter);
  if (input.select?.length) params.set("$select", input.select.join(","));
  if (input.top !== undefined) params.set("$top", String(input.top));
  if (input.skip !== undefined) params.set("$skip", String(input.skip));
  if (input.orderBy) params.set("$orderby", input.orderBy);

  return s4Url(`${base}?${params}`);
}

function toCsv(records: Record<string, unknown>[]): string {
  if (!records.length) return "(no results)";
  const headers = Object.keys(records[0] ?? {}).filter((k) => k !== "__metadata");
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const rows = records.map((r) => headers.map((h) => escape(r[h])).join(","));
  return [headers.join(","), ...rows].join("\n");
}

export const executeODataQueryTool = {
  name: "execute_odata_query",
  description:
    "Executes OData CRUD operations against SAP S/4HANA. " +
    "GET requests return data as CSV for easy reading. " +
    "POST, PATCH, and DELETE return JSON with the operation result. " +
    "Use discover_sap_services to find service names, get_entity_metadata for field names, " +
    "and get_field_values for valid input values before writing.",

  async handler(rawInput: unknown): Promise<ExecuteODataQueryResult> {
    const input = ExecuteODataQueryInputSchema.parse(rawInput);
    const method = input.method ?? "GET";

    if (method !== "GET") {
      enforceWritePolicy({ toolName: "execute_odata_query" });
    }

    const url = buildUrl({ ...input, method });

    if (env.LOG_LEVEL === "debug") {
      console.error(`[execute_odata_query] ${method} ${url}`);
    }

    try {
      let response: Response;

      if (method === "GET") {
        response = await fetch(url, { method: "GET", headers: getAuthHeaders() });
      } else {
        const serviceRoot = s4Url(`/sap/opu/odata/sap/${input.service}/`);
        const csrfToken = await fetchCsrfToken(serviceRoot);
        response = await fetch(url, {
          method,
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          ...(input.payload ? { body: JSON.stringify(input.payload) } : {}),
        });
      }

      if (!response.ok) {
        throw new Error(`SAP returned ${response.status}: ${await response.text()}`);
      }

      if (method === "DELETE") {
        auditLog({ toolName: "execute_odata_query", input, result: "success", detail: `DELETE ${url}` });
        return { content: "Record deleted successfully." };
      }

      const json = (await response.json()) as {
        d?: { results?: Record<string, unknown>[]; [k: string]: unknown };
      };

      if (method === "GET") {
        const rows = json.d?.results ?? (json.d ? [json.d] : []);
        const cleanRows = (rows as Record<string, unknown>[]).map((r) => {
          const { __metadata: _, ...rest } = r as Record<string, unknown> & { __metadata?: unknown };
          return rest;
        });
        return { content: toCsv(cleanRows), rowCount: cleanRows.length };
      }

      auditLog({
        toolName: "execute_odata_query",
        input,
        result: "success",
        detail: `${method} ${input.service}/${input.entity}`,
      });
      return { content: JSON.stringify(json.d ?? json, null, 2) };
    } catch (error) {
      if (method !== "GET") {
        auditLog({
          toolName: "execute_odata_query",
          input,
          result: "error",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
      throw error;
    }
  },
};
