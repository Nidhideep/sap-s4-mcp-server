---
name: sap-s4-mcp-server
description: >
  Query SAP S/4HANA OData services directly from Claude — discover service catalogs,
  fetch entity metadata, run OData queries (GET/POST/PATCH/DELETE), and retrieve
  field value lists. Use this when working with SAP S/4HANA data, building
  integrations, or exploring what OData services a system exposes.
  Requires a running SAP S/4HANA system and credentials.
license: MIT
compatibility: Node.js >= 18.0.0, SAP S/4HANA with OData services enabled
metadata:
  author: Nidhideep Bhandari
  repository: https://github.com/Nidhideep/sap-s4-mcp-server
  npm: https://www.npmjs.com/package/sap-s4-mcp-server
  category: enterprise
  tags: sap, s4hana, odata, erp, enterprise
---

# SAP S/4HANA MCP Server

MCP server for SAP S/4HANA OData access. Gives Claude governed, auditable access
to SAP S/4HANA data via OData services — discover, query, and write — without
leaving the conversation.

## When to use this skill

Use this skill when:
- Querying SAP S/4HANA data (materials, sales orders, finance documents, etc.)
- Discovering which OData services are available on a system
- Building or testing SAP integrations
- Extracting SAP data into reports or analyses

## Tools

| Tool | Description |
|------|-------------|
| `discover_sap_services` | List all available OData services from the SAP Gateway Service Catalog |
| `get_entity_metadata` | Fetch and summarize OData service metadata (entity sets, fields, keys) |
| `get_field_values` | Fetch dropdown/value-list values from SAP OData entities |
| `execute_odata_query` | Execute OData CRUD operations (GET returns CSV, writes return JSON) |

## Setup

```bash
git clone https://github.com/Nidhideep/sap-s4-mcp-server
cd sap-s4-mcp-server
npm install && npm run build
cp .env.example .env   # fill in SAP_ODATA_HOST, S4_ODATA_USER, S4_ODATA_PASSWORD
```

Register with Claude Code:
```bash
claude mcp add sap-s4 -- node /absolute/path/to/dist/src/index.js
```

## Required environment variables

| Variable | Description |
|----------|-------------|
| `S4_ODATA_HOST` | SAP S/4HANA URL (e.g. `https://my-s4.sap:44301`) |
| `S4_ODATA_CLIENT` | SAP client number (e.g. `100`) |
| `S4_ODATA_USER` | SAP username |
| `S4_ODATA_PASSWORD` | SAP password |

## Example prompts

- "Discover what OData services are available on our SAP system"
- "Show me the entity structure for the BusinessPartner OData service"
- "Query sales orders for customer 1000 from the last 30 days"
- "What are the valid values for the material type field?"
