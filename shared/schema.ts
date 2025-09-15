import { sql, eq } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
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
  userId: varchar("user_id"),
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

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  password: varchar("password"), // For local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: text("role").notNull().default('user'), // 'admin', 'user'
  isActive: boolean("is_active").default(false).notNull(), // Default to false for email confirmation
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Email confirmation tokens
export const emailTokens = pgTable("email_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).unique().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const walletSettings = pgTable("wallet_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  currency: text("currency").notNull(), // e.g. 'btc', 'eth', 'usdt-trc20'
  address: text("address").notNull(),
  network: text("network").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by").notNull(), // admin user id
});

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: text("updated_by").notNull(), // admin user id
});

// Admin logs table - for logging all admin actions
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "restrict" }),
  action: text("action").notNull(), // 'create', 'update', 'delete', 'activate', 'deactivate'
  target: text("target").notNull(), // 'user', 'wallet', 'currency', 'method', 'telegram'
  targetId: text("target_id"), // ID of the target object
  description: text("description").notNull(),
  metadata: jsonb("metadata"), // Additional data about the action
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Telegram configurations table
export const telegramConfigs = pgTable("telegram_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Friendly name for the config
  botToken: text("bot_token").notNull(), // Encrypted token stored here
  chatId: text("chat_id").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
});

// Exchange methods table
export const exchangeMethods = pgTable("exchange_methods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Method name (e.g., "Bank Transfer", "Card Payment")
  code: text("code").notNull().unique(), // Unique code (e.g., "bank_transfer", "card_payment")
  type: text("type").notNull(), // 'fiat_in', 'fiat_out', 'crypto_in', 'crypto_out'
  supportedCurrencies: jsonb("supported_currencies").notNull(), // Array of currency IDs
  parameters: jsonb("parameters"), // Method-specific parameters (fees, limits, etc.)
  isEnabled: boolean("is_enabled").default(true).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "restrict" }),
});

export const insertCurrencySchema = createInsertSchema(currencies);
export const insertExchangeRateSchema = createInsertSchema(exchangeRates);
export const insertOrderSchema = createInsertSchema(orders);
export const insertKycRequestSchema = createInsertSchema(kycRequests);
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const upsertUserSchema = createInsertSchema(users).pick({ id: true, email: true, firstName: true, lastName: true, profileImageUrl: true });
export const insertWalletSettingSchema = createInsertSchema(walletSettings).omit({ id: true, createdAt: true });
export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({ id: true, updatedAt: true });
export const insertEmailTokenSchema = createInsertSchema(emailTokens).omit({ id: true, createdAt: true });
export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({ id: true, createdAt: true });
export const insertTelegramConfigSchema = createInsertSchema(telegramConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertExchangeMethodSchema = createInsertSchema(exchangeMethods).omit({ id: true, createdAt: true, updatedAt: true });

export type Currency = typeof currencies.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type KycRequest = typeof kycRequests.$inferSelect;
export type User = typeof users.$inferSelect;
export type WalletSetting = typeof walletSettings.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type EmailToken = typeof emailTokens.$inferSelect;
export type AdminLog = typeof adminLogs.$inferSelect;
export type TelegramConfig = typeof telegramConfigs.$inferSelect;
export type ExchangeMethod = typeof exchangeMethods.$inferSelect;

export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type InsertExchangeRate = z.infer<typeof insertExchangeRateSchema>;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type InsertKycRequest = z.infer<typeof insertKycRequestSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertWalletSetting = z.infer<typeof insertWalletSettingSchema>;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type InsertEmailToken = z.infer<typeof insertEmailTokenSchema>;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type InsertTelegramConfig = z.infer<typeof insertTelegramConfigSchema>;
export type InsertExchangeMethod = z.infer<typeof insertExchangeMethodSchema>;

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
  contactEmail: z.string().email().optional().or(z.literal("")),
  userId: z.string().optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['admin', 'user']).default('user'),
});

export const registerSchema = z.object({
  login: z.string().min(1, "Login is required"),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

export const updateWalletSchema = z.object({
  currency: z.string(),
  address: z.string().min(1),
  network: z.string(),
  isActive: z.boolean().default(true),
});

export const updateSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
  isEncrypted: z.boolean().default(false),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type CreateUserRequest = z.infer<typeof createUserSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type UpdateWalletRequest = z.infer<typeof updateWalletSchema>;
export type UpdateSettingRequest = z.infer<typeof updateSettingSchema>;

// Admin panel validation schemas
export const adminCreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'user']),
  isActive: z.boolean().default(true),
});

export const adminUpdateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['admin', 'user']).optional(),
  isActive: z.boolean().optional(),
});

export const createTelegramConfigSchema = z.object({
  name: z.string().min(1),
  botToken: z.string().min(1),
  chatId: z.string().min(1),
  isDefault: z.boolean().default(false),
  description: z.string().optional(),
});

export const createExchangeMethodSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  type: z.enum(['fiat_in', 'fiat_out', 'crypto_in', 'crypto_out']),
  supportedCurrencies: z.array(z.string()),
  parameters: z.record(z.any()).optional(),
  description: z.string().optional(),
});

export const adminStatsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  totalOrders: z.number(),
  completedOrders: z.number(),
  totalCurrencies: z.number(),
  activeCurrencies: z.number(),
  totalWallets: z.number(),
  activeWallets: z.number(),
});

export type AdminCreateUserRequest = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserRequest = z.infer<typeof adminUpdateUserSchema>;
export type CreateTelegramConfigRequest = z.infer<typeof createTelegramConfigSchema>;
export type CreateExchangeMethodRequest = z.infer<typeof createExchangeMethodSchema>;
export type AdminStats = z.infer<typeof adminStatsSchema>;
