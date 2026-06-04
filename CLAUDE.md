# Claude Behavior Contract — SAP S4 MCP Server

## Governing Standard
Before making any change to this server, read:
  ../personal-enterprise-brain/ontology/mcp/sap-mcp-standard.md

## Tool Design Rules
1. Read tools — safe to call any time, no side effects, always return structured data
2. Write tools — log intent, execute, then verify by reading back
3. No raw SAP field names in user-facing responses — map to business terms
4. Strict Zod schemas — every parameter typed and described; no `any`
5. Business meaning first — tool names describe the action, not the OData call

## Recommended Workflow
1. `discover_sap_services` — find the right service name
2. `get_entity_metadata` — understand entity structure and key fields
3. `get_field_values` — look up valid dropdown values before writing
4. `execute_odata_query` — read or write data

## What Claude Must NOT Do
- Expose SAP technical OData error messages verbatim without translation
- Skip CSRF token fetch before write operations
- Commit or suggest committing .env or .mcp.json
- Guess at field names — always check metadata first

## Config Hierarchy
| Layer      | Where                             |
|------------|-----------------------------------|
| Enterprise | ~/.claude/CLAUDE.md               |
| Global     | ~/.claude/settings.json           |
| Project    | This file (CLAUDE.md)             |
| Local      | .env (never committed)            |

## Adding New Tools
1. Create `tools/your-tool.tool.ts` following an existing tool as the pattern
2. Import and register in `src/server.ts`
3. Update the tool table in README.md
4. Add an example to `examples/example-workflow.md`

## Auth
See docs/authentication.md. Auth method is set via the AUTH_METHOD env var.

## Governance
See docs/governance.md. DRY_RUN=true blocks all writes. Audit log goes to stderr.
