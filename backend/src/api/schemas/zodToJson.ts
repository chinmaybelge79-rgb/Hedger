import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export function toJsonSchema<T extends z.ZodType>(schema: T) {
  return zodToJsonSchema(schema as never, { target: 'openApi3' });
}