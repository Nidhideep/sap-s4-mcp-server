import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[sap-s4-mcp-server] running on stdio");
}

main().catch((error) => {
  console.error("[sap-s4-mcp-server] fatal error:", error);
  process.exit(1);
});
