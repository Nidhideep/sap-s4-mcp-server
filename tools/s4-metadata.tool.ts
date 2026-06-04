import { z } from "zod";
import { getAuthHeaders, s4Url } from "../config/auth.js";
import { env } from "../config/env.js";

export const GetEntityMetadataInputSchema = z.object({
  service: z.string().describe("OData service name, e.g. API_BUSINESS_PARTNER"),
});

export type GetEntityMetadataInput = z.infer<typeof GetEntityMetadataInputSchema>;

export interface EntityProperty {
  name: string;
  type: string;
  nullable: boolean;
  maxLength?: string;
  label?: string;
}

export interface EntitySetInfo {
  name: string;
  entityType: string;
  keyProperties: string[];
  properties: EntityProperty[];
  navigationProperties: string[];
}

export interface MetadataSummary {
  service: string;
  entitySetCount: number;
  entitySets: EntitySetInfo[];
}

function attrValue(attrs: string, key: string): string | undefined {
  const m = new RegExp(`${key}="([^"]*)"`, "i").exec(attrs);
  return m?.[1];
}

function parseMetadataXml(xml: string, service: string): MetadataSummary {
  // Strip namespace prefixes so we can match tags uniformly
  const normalised = xml.replace(/<([a-zA-Z]+):/g, "<").replace(/<\/([a-zA-Z]+):/g, "</");

  // Build a map of EntityType name → parsed info
  const entityTypes = new Map<
    string,
    { properties: EntityProperty[]; keyProps: string[]; navProps: string[] }
  >();

  const etRegex = /<EntityType\s+([^>]+)>([\s\S]*?)<\/EntityType>/g;
  let etMatch: RegExpExecArray | null;
  while ((etMatch = etRegex.exec(normalised)) !== null) {
    const typeName = attrValue(etMatch[1] ?? "", "Name") ?? "";
    const body = etMatch[2] ?? "";

    const properties: EntityProperty[] = [];
    const propRegex = /<Property\s+([^/]+)\/>/g;
    let pm: RegExpExecArray | null;
    while ((pm = propRegex.exec(body)) !== null) {
      const a = pm[1] ?? "";
      const name = attrValue(a, "Name") ?? "";
      if (!name) continue;
      const rawType = attrValue(a, "Type") ?? "String";
      const maxLength = attrValue(a, "MaxLength");
      const label = attrValue(a, "sap:label");
      const prop: EntityProperty = {
        name,
        type: rawType.includes(".") ? rawType.split(".").pop()! : rawType,
        nullable: attrValue(a, "Nullable") !== "false",
      };
      if (maxLength !== undefined) prop.maxLength = maxLength;
      if (label !== undefined) prop.label = label;
      properties.push(prop);
    }

    const keyProps: string[] = [];
    const keyBodyMatch = /<Key>([\s\S]*?)<\/Key>/.exec(body);
    if (keyBodyMatch) {
      const kr = /<PropertyRef\s+Name="([^"]+)"/g;
      let km: RegExpExecArray | null;
      while ((km = kr.exec(keyBodyMatch[1] ?? "")) !== null) {
        keyProps.push(km[1] ?? "");
      }
    }

    const navProps: string[] = [];
    const nr = /<NavigationProperty\s+Name="([^"]+)"/g;
    let nm: RegExpExecArray | null;
    while ((nm = nr.exec(body)) !== null) {
      navProps.push(nm[1] ?? "");
    }

    entityTypes.set(typeName, { properties, keyProps, navProps });
  }

  // Build entity set list
  const entitySets: EntitySetInfo[] = [];
  const esRegex = /<EntitySet\s+([^/]+)\/>/g;
  let esMatch: RegExpExecArray | null;
  while ((esMatch = esRegex.exec(normalised)) !== null) {
    const a = esMatch[1] ?? "";
    const setName = attrValue(a, "Name") ?? "";
    const rawType = attrValue(a, "EntityType") ?? "";
    const typeName = rawType.includes(".") ? rawType.split(".").pop()! : rawType;
    const typeInfo = entityTypes.get(typeName);
    entitySets.push({
      name: setName,
      entityType: typeName,
      keyProperties: typeInfo?.keyProps ?? [],
      properties: typeInfo?.properties ?? [],
      navigationProperties: typeInfo?.navProps ?? [],
    });
  }

  return { service, entitySetCount: entitySets.length, entitySets };
}

export const getEntityMetadataTool = {
  name: "get_entity_metadata",
  description:
    "Fetches and summarizes OData service metadata from SAP S/4HANA. " +
    "Returns all entity sets with their key fields, properties, and navigation properties. " +
    "Use this before calling execute_odata_query to understand the available fields and correct entity names.",

  async handler(rawInput: unknown): Promise<MetadataSummary> {
    const input = GetEntityMetadataInputSchema.parse(rawInput);

    const url = s4Url(`/sap/opu/odata/sap/${input.service}/$metadata`);

    if (env.LOG_LEVEL === "debug") {
      console.error(`[get_entity_metadata] GET ${url}`);
    }

    const response = await fetch(url, {
      method: "GET",
      headers: { ...getAuthHeaders(), Accept: "application/xml" },
    });

    if (!response.ok) {
      throw new Error(
        `SAP metadata request failed ${response.status}: ${await response.text()}`
      );
    }

    const xml = await response.text();
    return parseMetadataXml(xml, input.service);
  },
};
