import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const prompts = pgTable('prompts', {
  id: serial('id').primaryKey(),
  prompt: text('prompt'),
});

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name')
})