import z from 'zod'

export const requestSchema = z.object({
    content: z.string().min(1, "Content cannot be empty"),
})

export const responseSchema = z.object({
    id: z.uuid(),
    userId: z.uuid(),
    content: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  });