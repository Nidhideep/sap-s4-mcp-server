import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  S4_ODATA_HOST: z.string().url("S4_ODATA_HOST must be a full URL, e.g. https://my-s4.example.com:44301"),
  S4_ODATA_CLIENT: z.string().default("100"),
  AUTH_METHOD: z.enum(["basic", "token"]).default("basic"),
  S4_ODATA_USER: z.string().optional(),
  S4_ODATA_PASSWORD: z.string().optional(),
  S4_ODATA_TOKEN: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  DRY_RUN: z.coerce.boolean().default(false),
});

function loadEnv() {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Environment configuration invalid:\n${issues}`);
  }
  return result.data;
}

export const env = loadEnv();
export type Env = typeof env;
