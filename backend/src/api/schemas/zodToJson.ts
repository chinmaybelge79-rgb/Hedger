import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export function toJsonSchema<T extends z.ZodTypeAny>(schema: T) {
  return zodToJsonSchema(schema, { target: 'openApi3' });
}