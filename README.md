# SAP S4 MCP Server

MCP server for SAP S/4HANA OData access. Discover services, query entities, fetch metadata, and manage data — built on the [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk) TypeScript SDK.

## Tools

| Tool | Description |
|------|-------------|
| `discover_sap_services` | Discovers available services from the SAP Gateway Service Catalog |
| `get_entity_metadata` | Fetches and summarizes OData service metadata optimized for LLM consumption |
| `get_field_values` | Fetches dropdown/value-list values from SAP OData entities |
| `execute_odata_query` | Executes OData CRUD operations (GET returns CSV, writes return JSON) |

## Prerequisites

- Node.js >= 18.0.0
- SAP S/4HANA system with OData services enabled
- SAP user with appropriate OData authorizations

## Setup

```bash
git clone https://github.com/Nidhideep/sap-s4-mcp-server
cd sap-s4-mcp-server
npm install
cp .env.example .env
# Edit .env with your SAP connection details
npm run build
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

### OData Connection (required)

| Variable | Description | Example |
|----------|-------------|---------|
| `S4_ODATA_HOST` | Full SAP S/4HANA URL including scheme and port | `https://my-s4.sap:44301` |
| `S4_ODATA_CLIENT` | SAP client number | `100` |
| `AUTH_METHOD` | `basic` or `token` | `basic` |
| `S4_ODATA_USER` | SAP user (when AUTH_METHOD=basic) | `ODATA_USER` |
| `S4_ODATA_PASSWORD` | Password (when AUTH_METHOD=basic) | |
| `S4_ODATA_TOKEN` | Bearer token (when AUTH_METHOD=token) | |

### Operational

| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_LEVEL` | `debug`, `info`, `warn`, `error` | `info` |
| `DRY_RUN` | When `true`, all write operations are blocked | `false` |

## MCP Client Configuration

### Claude Code

```bash
claude mcp add sap-s4-mcp-server -- node /absolute/path/to/sap-s4-mcp-server/dist/src/index.js
```

Then set env vars via `.mcp.json` (copy from `.mcp.example.json`).

### Claude Desktop / Cline

Copy `.mcp.example.json` to `.mcp.json`, fill in real values, and add to your MCP client config:

```json
{
  "mcpServers": {
    "sap-s4-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/sap-s4-mcp-server/dist/src/index.js"],
      "env": {
        "S4_ODATA_HOST": "https://your-s4.example.com:44301",
        "S4_ODATA_CLIENT": "100",
        "AUTH_METHOD": "basic",
        "S4_ODATA_USER": "your_user",
        "S4_ODATA_PASSWORD": "your_password"
      }
    }
  }
}
```

## Recommended Workflow

1. **Discover** — `discover_sap_services` to find the service name
2. **Understand** — `get_entity_metadata` to see entity sets and field names
3. **Validate inputs** — `get_field_values` to look up valid dropdown values
4. **Query or write** — `execute_odata_query` with the correct service, entity, and fields

## Project Structure

```
src/
  index.ts              # Server entry point (stdio transport)
  server.ts             # Tool registration
tools/
  s4-discover-services.tool.ts   # Gateway catalog discovery
  s4-metadata.tool.ts            # OData $metadata parser
  s4-field-values.tool.ts        # Value-list / dropdown fetcher
  s4-odata-query.tool.ts         # CRUD query executor
config/
  env.ts                # Zod-validated environment config
  auth.ts               # Auth headers + CSRF token fetch
  policy.ts             # DRY_RUN enforcement + audit log
docs/
  authentication.md
  governance.md
  troubleshooting.md
examples/
  example-workflow.md
```

## Development

```bash
npm run dev        # Watch mode with tsx
npm run typecheck  # Type-check without building
npm run build      # Compile to dist/
```

## Governance

- `DRY_RUN=true` blocks all write operations — safe for read-only environments
- All write operations are audit-logged to stderr
- CSRF tokens are fetched automatically before every write
- No credentials are ever committed — use `.env` (gitignored) or MCP client env injection
