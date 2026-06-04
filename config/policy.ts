import { env } from "./env.js";

export class PolicyViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PolicyViolation";
  }
}

interface WritePolicyContext {
  toolName: string;
}

export function enforceWritePolicy(ctx: WritePolicyContext): void {
  if (env.DRY_RUN) {
    throw new PolicyViolation(
      `Write blocked: DRY_RUN=true. Set DRY_RUN=false to enable write operations. Tool: ${ctx.toolName}`
    );
  }
}

interface AuditEntry {
  toolName: string;
  input: unknown;
  result: "success" | "error";
  detail: string;
}

export function auditLog(entry: AuditEntry): void {
  console.error(
    `[audit] ${entry.result.toUpperCase()} tool=${entry.toolName} detail="${entry.detail}"`
  );
}
