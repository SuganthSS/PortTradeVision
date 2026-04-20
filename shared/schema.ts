import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
});

export const ports = pgTable("ports", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  location: text("location").notNull(),
  country: text("country").notNull(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
});

export const transactionTypeEnum = ["import", "export"] as const;

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey(),
  date: timestamp("date").notNull(),
  portId: varchar("port_id").notNull(),
  productId: varchar("product_id").notNull(),
  type: text("type").notNull(),
  quantity: decimal("quantity", { precision: 15, scale: 2 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertPortSchema = createInsertSchema(ports).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true }).extend({
  type: z.enum(transactionTypeEnum, {
    errorMap: () => ({ message: "Type must be either 'import' or 'export'" }),
  }),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Port = typeof ports.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type InsertPort = z.infer<typeof insertPortSchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
