import { z } from "zod";
import { getAuthHeaders, s4Url } from "../config/auth.js";
import { env } from "../config/env.js";

export const DiscoverSapServicesInputSchema = z.object({
  search: z
    .string()
    .optional()
    .describe("Filter services by name or title substring (case-insensitive)"),
  top: z
    .number()
    .int()
    .positive()
    .optional()
    .default(50)
    .describe("Maximum number of services to return (default 50)"),
});

export type DiscoverSapServicesInput = z.infer<typeof DiscoverSapServicesInputSchema>;

export interface ServiceEntry {
  name: string;
  title: string;
  namespace: string;
  version: string;
  description: string;
}

export interface DiscoverSapServicesResult {
  services: ServiceEntry[];
  totalFound: number;
}

export const discoverSapServicesTool = {
  name: "discover_sap_services",
  description:
    "Discovers available OData services from the SAP Gateway Service Catalog. " +
    "Returns service names, titles, and descriptions. " +
    "Use this first when you don't know which service name to pass to execute_odata_query or get_entity_metadata.",

  async handler(rawInput: unknown): Promise<DiscoverSapServicesResult> {
    const input = DiscoverSapServicesInputSchema.parse(rawInput);

    const params = new URLSearchParams({
      $top: String(input.top),
      $format: "json",
    });

    if (input.search) {
      const escaped = input.search.replace(/'/g, "''");
      params.set(
        "$filter",
        `substringof('${escaped}',TechnicalServiceName) or substringof('${escaped}',Title)`
      );
    }

    const url = s4Url(`/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/ServiceCollection?${params}`);

    if (env.LOG_LEVEL === "debug") {
      console.error(`[discover_sap_services] GET ${url}`);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `SAP catalog request failed ${response.status}: ${await response.text()}`
      );
    }

    const data = (await response.json()) as {
      d?: {
        results?: Array<{
          TechnicalServiceName?: string;
          Title?: string;
          TechnicalServiceVersion?: string;
          Description?: string;
          Namespace?: string;
        }>;
      };
    };

    const results = data.d?.results ?? [];
    const services: ServiceEntry[] = results.map((r) => ({
      name: r.TechnicalServiceName ?? "",
      title: r.Title ?? "",
      namespace: r.Namespace ?? "",
      version: r.TechnicalServiceVersion ?? "",
      description: r.Description ?? "",
    }));

    return { services, totalFound: services.length };
  },
};
