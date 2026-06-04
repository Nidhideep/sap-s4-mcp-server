# Example Workflow — Read Business Partner Data

This example shows the recommended four-step workflow for querying SAP S/4HANA data.

## Step 1: Discover the right service

```
Tool: discover_sap_services
Input: { "search": "BUSINESS_PARTNER" }
```

Returns a list of matching services. Identify the one you need, e.g. `API_BUSINESS_PARTNER`.

## Step 2: Understand entity structure

```
Tool: get_entity_metadata
Input: { "service": "API_BUSINESS_PARTNER" }
```

Returns all entity sets with their key fields and properties. Identify the entity you need, e.g. `A_BusinessPartner`, and note the key field `BusinessPartner`.

## Step 3: Look up valid input values (for writes)

```
Tool: get_field_values
Input: {
  "service": "API_BUSINESS_PARTNER",
  "entity": "A_BusinessPartnerRole",
  "valueField": "BusinessPartnerRole",
  "labelField": "BusinessPartnerRoleName"
}
```

Returns the list of valid role codes before you try to write one.

## Step 4: Query data

```
Tool: execute_odata_query
Input: {
  "service": "API_BUSINESS_PARTNER",
  "entity": "A_BusinessPartner",
  "method": "GET",
  "filter": "BusinessPartnerCategory eq '1'",
  "select": ["BusinessPartner", "BusinessPartnerFullName", "BusinessPartnerCategory"],
  "top": 20
}
```

Returns the matching records as CSV.

---

# Example Workflow — Create a Business Partner (Write)

## Step 1–3: Same as above — discover, understand, validate values

## Step 4: Write

```
Tool: execute_odata_query
Input: {
  "service": "API_BUSINESS_PARTNER",
  "entity": "A_BusinessPartner",
  "method": "POST",
  "payload": {
    "BusinessPartnerCategory": "1",
    "BusinessPartnerFullName": "Acme Corp",
    "OrganizationBPName1": "Acme Corp"
  }
}
```

The server automatically fetches a CSRF token and includes it in the request. The response contains the created record as JSON.
