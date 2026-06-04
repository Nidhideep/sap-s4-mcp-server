# Authentication

Two auth methods are supported via the `AUTH_METHOD` env var.

## Basic Auth (recommended for on-premise)

```env
AUTH_METHOD=basic
S4_ODATA_USER=your_username
S4_ODATA_PASSWORD=your_password
```

Every request includes a `Basic` Authorization header. Requires HTTPS.

## Bearer Token

```env
AUTH_METHOD=token
S4_ODATA_TOKEN=your_bearer_token
```

Suitable for BTP-connected systems using SAP IAS, Azure AD, or Okta tokens. You are responsible for token refresh.

## CSRF Tokens (writes only)

Write operations (POST, PATCH, DELETE) require a CSRF token. The server fetches it automatically:

1. Issues a GET to the service root with `X-CSRF-Token: Fetch`
2. Extracts the token from the response header
3. Includes it in the write request

No manual handling needed.

## Troubleshooting Auth Failures

**401 Unauthorized** — wrong username/password, or token expired.

**403 Forbidden** — user exists but lacks OData authorization. Check SAP role assignments.

**CSRF token not returned** — the service root URL may be wrong, or the user has no read access to the service.
