# Governance

## DRY_RUN Mode

Set `DRY_RUN=true` to block all write operations (POST, PATCH, DELETE) without changing any other behavior. Read tools work normally.

Use this in staging or read-only environments to prevent accidental writes.

## Audit Log

Every write operation (success or failure) emits a structured log line to stderr:

```
[audit] SUCCESS tool=execute_odata_query detail="POST API_BUSINESS_PARTNER/A_BusinessPartner"
[audit] ERROR tool=execute_odata_query detail="SAP returned 400: ..."
```

Redirect stderr to your log aggregator (Splunk, CloudWatch, etc.) to build an audit trail.

## Credential Protection

- Never commit `.env` or `.mcp.json` — both are gitignored
- Rotate credentials immediately if exposed
- Use MCP client env injection (not hardcoded in source) for all secrets

## Policy Enforcement

`config/policy.ts` is the single place to add write controls:
- Domain-specific restrictions (e.g., block writes to certain company codes)
- Business-hours enforcement
- Rate limiting
