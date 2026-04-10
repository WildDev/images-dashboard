import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const imagesTable = pgTable("images", {
  id: text("id").primaryKey(),
  sourceUrl: text("source_url"),
  status: text("status").notNull().default("NEW"),
  contentType: text("content_type"),
  multiSize: boolean("multi_size").notNull().default(false),
  width: integer("width"),
  height: integer("height"),
  added: timestamp("added", { withTimezone: true }).notNull().defaultNow(),
  processed: timestamp("processed", { withTimezone: true }),
});

export const insertImageSchema = createInsertSchema(imagesTable).omit({ added: true });
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof imagesTable.$inferSelect;
