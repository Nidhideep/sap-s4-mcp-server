import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  discoverSapServicesTool,
  DiscoverSapServicesInputSchema,
} from "../tools/s4-discover-services.tool.js";
import {
  getEntityMetadataTool,
  GetEntityMetadataInputSchema,
} from "../tools/s4-metadata.tool.js";
import {
  getFieldValuesTool,
  GetFieldValuesInputSchema,
} from "../tools/s4-field-values.tool.js";
import {
  executeODataQueryTool,
  ExecuteODataQueryInputSchema,
} from "../tools/s4-odata-query.tool.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: "sap-s4-mcp-server",
    version: "0.1.0",
  });

  server.tool(
    discoverSapServicesTool.name,
    discoverSapServicesTool.description,
    DiscoverSapServicesInputSchema.shape,
    async ({ search, top }) => {
      const result = await discoverSapServicesTool.handler({ search, top });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    getEntityMetadataTool.name,
    getEntityMetadataTool.description,
    GetEntityMetadataInputSchema.shape,
    async ({ service }) => {
      const result = await getEntityMetadataTool.handler({ service });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    getFieldValuesTool.name,
    getFieldValuesTool.description,
    GetFieldValuesInputSchema.shape,
    async ({ service, entity, valueField, labelField, top }) => {
      const result = await getFieldValuesTool.handler({ service, entity, valueField, labelField, top });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    executeODataQueryTool.name,
    executeODataQueryTool.description,
    ExecuteODataQueryInputSchema.shape,
    async ({ service, entity, method, entityKey, filter, select, top, skip, orderBy, payload }) => {
      const result = await executeODataQueryTool.handler({
        service,
        entity,
        method,
        entityKey,
        filter,
        select,
        top,
        skip,
        orderBy,
        payload,
      });
      const text = result.rowCount !== undefined
        ? `${result.content}\n\n(${result.rowCount} row${result.rowCount !== 1 ? "s" : ""})`
        : result.content;
      return { content: [{ type: "text", text }] };
    }
  );

  return server;
}
