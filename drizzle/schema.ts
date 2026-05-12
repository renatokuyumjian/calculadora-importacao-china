import {
  double,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const taxRates = mysqlTable(
  "taxRates",
  {
    id: int("id").autoincrement().primaryKey(),
    ncm: varchar("ncm", { length: 12 }).notNull(),
    description: text("description").notNull(),
    iiRate: double("iiRate").default(0).notNull(),
    ipiRate: double("ipiRate").default(0).notNull(),
    source: varchar("source", { length: 120 }).default("manual").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => ({
    ncmIdx: uniqueIndex("taxRates_ncm_unique").on(table.ncm),
  }),
);

export const importQuotes = mysqlTable("importQuotes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  name: varchar("name", { length: 160 }).notNull(),
  ncm: varchar("ncm", { length: 12 }).notNull(),
  description: text("description"),
  payload: json("payload").notNull(),
  results: json("results").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const importReports = mysqlTable("importReports", {
  id: int("id").autoincrement().primaryKey(),
  quoteId: int("quoteId")
    .notNull()
    .references(() => importQuotes.id),
  userId: int("userId")
    .notNull()
    .references(() => users.id),
  fileKey: text("fileKey").notNull(),
  fileUrl: text("fileUrl").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type TaxRate = typeof taxRates.$inferSelect;
export type InsertTaxRate = typeof taxRates.$inferInsert;
export type ImportQuote = typeof importQuotes.$inferSelect;
export type InsertImportQuote = typeof importQuotes.$inferInsert;
export type ImportReport = typeof importReports.$inferSelect;
export type InsertImportReport = typeof importReports.$inferInsert;
