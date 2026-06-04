import { z } from "zod";
import { getAuthHeaders, s4Url } from "../config/auth.js";
import { env } from "../config/env.js";

export const GetFieldValuesInputSchema = z.object({
  service: z.string().describe("OData service name, e.g. API_BUSINESS_PARTNER"),
  entity: z
    .string()
    .describe("Entity set that serves as a value-help list, e.g. A_BPContactToFuncAndDept"),
  valueField: z
    .string()
    .describe("Technical field name whose distinct values you want, e.g. BusinessPartnerCategory"),
  labelField: z
    .string()
    .optional()
    .describe("Field that holds the human-readable description for each value"),
  top: z
    .number()
    .int()
    .positive()
    .optional()
    .default(200)
    .describe("Maximum number of values to return (default 200)"),
});

export type GetFieldValuesInput = z.infer<typeof GetFieldValuesInputSchema>;

export interface FieldValue {
  value: string;
  label: string;
}

export interface GetFieldValuesResult {
  service: string;
  entity: string;
  field: string;
  values: FieldValue[];
}

export const getFieldValuesTool = {
  name: "get_field_values",
  description:
    "Fetches dropdown and value-list options from a SAP S/4HANA OData entity. " +
    "Use this to discover valid input values before writing data with execute_odata_query. " +
    "Provide the entity set that acts as the value-help source and the target field name.",

  async handler(rawInput: unknown): Promise<GetFieldValuesResult> {
    const input = GetFieldValuesInputSchema.parse(rawInput);

    const selectFields = input.labelField
      ? [input.valueField, input.labelField]
      : [input.valueField];

    const params = new URLSearchParams({
      $top: String(input.top),
      $select: selectFields.join(","),
      $format: "json",
    });

    const url = s4Url(`/sap/opu/odata/sap/${input.service}/${input.entity}?${params}`);

    if (env.LOG_LEVEL === "debug") {
      console.error(`[get_field_values] GET ${url}`);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `SAP field values request failed ${response.status}: ${await response.text()}`
      );
    }

    const data = (await response.json()) as {
      d?: { results?: Record<string, unknown>[] };
    };

    const results = data.d?.results ?? [];
    const seen = new Set<string>();
    const values: FieldValue[] = [];

    for (const r of results) {
      const raw = r[input.valueField];
      if (raw == null) continue;
      const val = String(raw);
      if (seen.has(val)) continue;
      seen.add(val);
      values.push({
        value: val,
        label: input.labelField ? String(r[input.labelField] ?? val) : val,
      });
    }

    return { service: input.service, entity: input.entity, field: input.valueField, values };
  },
};
