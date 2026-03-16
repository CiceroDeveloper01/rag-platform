import { ZodSchema } from "zod";

export function validateEnv<T>(
  schema: ZodSchema<T>,
  config: Record<string, unknown>,
): Record<string, unknown> {
  schema.parse(config);
  return config;
}
