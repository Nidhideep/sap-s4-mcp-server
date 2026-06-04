import { env } from "./env.js";

export type AuthHeaders = Record<string, string>;

export function getAuthHeaders(): AuthHeaders {
  const base: AuthHeaders = {
    "sap-client": env.S4_ODATA_CLIENT,
    Accept: "application/json",
  };

  switch (env.AUTH_METHOD) {
    case "token":
      if (!env.S4_ODATA_TOKEN)
        throw new Error("AUTH_METHOD=token but S4_ODATA_TOKEN is not set");
      return { ...base, Authorization: `Bearer ${env.S4_ODATA_TOKEN}` };

    case "basic":
      if (!env.S4_ODATA_USER || !env.S4_ODATA_PASSWORD)
        throw new Error("AUTH_METHOD=basic but S4_ODATA_USER or S4_ODATA_PASSWORD is not set");
      return {
        ...base,
        Authorization: `Basic ${Buffer.from(`${env.S4_ODATA_USER}:${env.S4_ODATA_PASSWORD}`).toString("base64")}`,
      };
  }
}

export function s4Url(path: string): string {
  return `${env.S4_ODATA_HOST}${path}`;
}

export async function fetchCsrfToken(serviceRootUrl: string): Promise<string> {
  const response = await fetch(serviceRootUrl, {
    method: "GET",
    headers: { ...getAuthHeaders(), "X-CSRF-Token": "Fetch" },
  });
  const token = response.headers.get("x-csrf-token");
  if (!token) {
    throw new Error(
      `SAP did not return a CSRF token from ${serviceRootUrl}. ` +
        "Check that the service URL is correct and that the user has write authorization."
    );
  }
  return token;
}
