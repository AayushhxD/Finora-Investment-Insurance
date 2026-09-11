-- Initial schema for app (matches lib/db/schema.ts)

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId" TEXT NOT NULL,
  CONSTRAINT fk_session_user FOREIGN KEY("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "idToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMP,
  "refreshTokenExpiresAt" TIMESTAMP,
  scope TEXT,
  password TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_account_user FOREIGN KEY("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now(),
  "updatedAt" TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "investment_products" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  "fundSize" NUMERIC NOT NULL,
  "returnPa" NUMERIC NOT NULL,
  risk TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "user_investments" (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "productId" INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  units NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_user_investments_user FOREIGN KEY("userId") REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_investments_product FOREIGN KEY("productId") REFERENCES "investment_products"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "insurance_policies" (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "policyNumber" TEXT NOT NULL,
  provider TEXT NOT NULL,
  type TEXT NOT NULL,
  coverage NUMERIC NOT NULL,
  premium NUMERIC NOT NULL,
  "renewalDate" DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT fk_insurance_user FOREIGN KEY("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "audit_logs" (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  "entityId" TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" ("userId");
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account" ("userId");
CREATE INDEX IF NOT EXISTS idx_user_investments_userId ON "user_investments" ("userId");
