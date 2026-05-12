import { and, desc, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  ImportQuote,
  InsertImportQuote,
  InsertImportReport,
  InsertTaxRate,
  InsertUser,
  importQuotes,
  importReports,
  taxRates,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export const seedRates: InsertTaxRate[] = [
  {
    ncm: "3307.20.10",
    description: "Desodorantes corporais e antiperspirantes",
    iiRate: 18,
    ipiRate: 9.75,
    source: "base inicial editável",
  },
  {
    ncm: "3923.30.90",
    description: "Garrafões, garrafas, frascos e artigos semelhantes de plástico — outros",
    iiRate: 18,
    ipiRate: 9.75,
    source: "base inicial editável",
  },
  {
    ncm: "3923.50.00",
    description: "Rolhas, tampas, cápsulas e outros dispositivos para fechar recipientes de plástico",
    iiRate: 18,
    ipiRate: 9.75,
    source: "base inicial editável",
  },
  {
    ncm: "8424.89.10",
    description: "Aparelhos mecânicos para projetar, dispersar ou pulverizar líquidos — válvulas spray",
    iiRate: 14,
    ipiRate: 3.25,
    source: "base inicial editável",
  },
];

export async function ensureSeedTaxRates() {
  const db = await getDb();
  if (!db) return [];

  for (const rate of seedRates) {
    await db.insert(taxRates).values(rate).onDuplicateKeyUpdate({
      set: {
        description: rate.description,
        iiRate: rate.iiRate,
        ipiRate: rate.ipiRate,
        source: rate.source,
      },
    });
  }

  return db.select().from(taxRates).orderBy(taxRates.ncm);
}

export async function searchTaxRates(term: string) {
  const db = await getDb();
  if (!db) return seedRates;
  await ensureSeedTaxRates();
  const normalized = `%${term.trim()}%`;
  if (!term.trim()) return db.select().from(taxRates).orderBy(taxRates.ncm).limit(50);
  return db
    .select()
    .from(taxRates)
    .where(or(like(taxRates.ncm, normalized), like(taxRates.description, normalized)))
    .orderBy(taxRates.ncm)
    .limit(50);
}

export async function upsertTaxRate(input: InsertTaxRate) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(taxRates).values(input).onDuplicateKeyUpdate({
    set: {
      description: input.description,
      iiRate: input.iiRate,
      ipiRate: input.ipiRate,
      source: input.source ?? "manual",
    },
  });
  const rows = await db.select().from(taxRates).where(eq(taxRates.ncm, input.ncm)).limit(1);
  return rows[0];
}

export async function listQuotes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importQuotes).where(eq(importQuotes.userId, userId)).orderBy(desc(importQuotes.updatedAt));
}

export async function getQuote(userId: number, id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(importQuotes)
    .where(and(eq(importQuotes.userId, userId), eq(importQuotes.id, id)))
    .limit(1);
  return rows[0];
}

export async function createQuote(values: InsertImportQuote) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  const result = await db.insert(importQuotes).values(values).$returningId();
  const id = result[0]?.id;
  if (!id) throw new Error("Não foi possível criar o orçamento");
  return getQuote(values.userId, id) as Promise<ImportQuote>;
}

export async function updateQuote(userId: number, id: number, values: Partial<InsertImportQuote>) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.update(importQuotes).set(values).where(and(eq(importQuotes.userId, userId), eq(importQuotes.id, id)));
  return getQuote(userId, id);
}

export async function deleteQuote(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.delete(importQuotes).where(and(eq(importQuotes.userId, userId), eq(importQuotes.id, id)));
  return { success: true } as const;
}

export async function createReport(values: InsertImportReport) {
  const db = await getDb();
  if (!db) throw new Error("Banco de dados indisponível");
  await db.insert(importReports).values(values);
  return { success: true } as const;
}

export async function listReports(userId: number, quoteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(importReports)
    .where(and(eq(importReports.userId, userId), eq(importReports.quoteId, quoteId)))
    .orderBy(desc(importReports.createdAt));
}

export async function listAllReports(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(importReports).where(eq(importReports.userId, userId)).orderBy(desc(importReports.createdAt));
}
