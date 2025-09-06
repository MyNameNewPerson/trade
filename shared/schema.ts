import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const currencies = pgTable("currencies", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'crypto' or 'fiat'
  network: text("network"), // e.g., 'TRC20', 'ERC20', 'BTC'
  minAmount: decimal("min_amount", { precision: 18, scale: 8 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  iconUrl: text("icon_url"),
});

export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  rate: decimal("rate", { precision: 18, scale: 8 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  fromAmount: decimal("from_amount", { precision: 18, scale: 8 }).notNull(),
  toAmount: decimal("to_amount", { precision: 18, scale: 8 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 18, scale: 8 }).notNull(),
  rateType: text("rate_type").notNull(), // 'fixed' or 'float'
  status: text("status").notNull(), // 'awaiting_deposit', 'confirmed', 'processing', 'completed', 'failed', 'refunded'
  depositAddress: text("deposit_address").notNull(),
  recipientAddress: text("recipient_address"),
  cardDetails: jsonb("card_details"), // For card payouts: { number: masked, bankName, holderName }
  contactEmail: text("contact_email"),
  platformFee: decimal("platform_fee", { precision: 18, scale: 8 }).notNull(),
  networkFee: decimal("network_fee", { precision: 18, scale: 8 }),
  rateLockExpiry: timestamp("rate_lock_expiry"),
  txHash: text("tx_hash"),
  payoutTxHash: text("payout_tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const kycRequests = pgTable("kyc_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: text("order_id").notNull(),
  status: text("status").notNull(), // 'pending', 'approved', 'rejected'
  documentType: text("document_type"),
  documentUrl: text("document_url"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCurrencySchema = createInsertSchema(currencies);
export const insertExchangeRateSchema = createInsertSchema(exchangeRates);
export const insertOrderSchema = createInsertSchema(orders);
export const insertKycRequestSchema = createInsertSchema(kycRequests);

export type Currency = typeof currencies.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type KycRequest = typeof kycRequests.$inferSelect;

export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertKycRequest = z.infer<typeof insertKycRequestSchema>;

// Additional validation schemas for API
export const createOrderSchema = z.object({
  fromCurrency: z.string().min(1),
  toCurrency: z.string().min(1),
  fromAmount: z.string().min(1),
  rateType: z.enum(['fixed', 'float']),
  recipientAddress: z.string().optional(),
  cardDetails: z.object({
    number: z.string().min(16),
    bankName: z.string().min(1),
    holderName: z.string().min(1),
  }).optional(),
  contactEmail: z.string().email().optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
