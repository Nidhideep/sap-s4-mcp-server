# Troubleshooting

## Server not discovered by Claude

- Run `npm run build` — the `dist/` directory must exist
- Use absolute paths in `.mcp.json`, not relative ones
- Restart your MCP client after updating `.mcp.json`

## SAP returns 401

- Wrong username or password — check `S4_ODATA_USER` / `S4_ODATA_PASSWORD`
- If using token auth, the token may have expired

## SAP returns 403

- User exists but lacks OData authorization
- Check SAP role assignments for the OData service you're calling

## SAP returns 404 on service root

- `S4_ODATA_HOST` is wrong, or the service is not activated
- Activate the service in transaction `/IWFND/MAINT_SERVICE`

## CSRF token not returned

- The service URL is wrong — the CSRF fetch targets the service root, not a specific entity
- The user does not have read access to the service

## `discover_sap_services` returns empty

- The SAP Gateway catalog service may not be enabled
- Activate `CATALOGSERVICE` in `/IWFND/MAINT_SERVICE`

## Write tool returns "Write blocked: DRY_RUN=true"

- Expected behavior when `DRY_RUN=true` — set it to `false` to allow writes

## `get_entity_metadata` returns empty entity sets

- The service may use OData v4 (this server supports OData v2 only)
- Check that `$metadata` is accessible manually at `{S4_ODATA_HOST}/sap/opu/odata/sap/{SERVICE}/$metadata`

## Enable debug logging

Set `LOG_LEVEL=debug` to see every request URL in stderr output.
