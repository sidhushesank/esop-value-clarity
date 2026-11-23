import { z } from "zod";

export const markDoneSchema = z.object({
  key: z.string().min(3).max(300),
  done: z.boolean(),
  doneOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  title: z.string().max(200).optional(),
  subject: z.string().max(300).optional(),
});
