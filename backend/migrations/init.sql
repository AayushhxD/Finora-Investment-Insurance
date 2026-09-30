-- Initial schema for app (matches infrastructure/database/schema.ts)

CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'RM',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT user_role_check CHECK (role IN ('RM', 'Manager', 'Admin'))
);

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'RM';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_role_check' AND conrelid = 'public."user"'::regclass) THEN
    ALTER TABLE "user" ADD CONSTRAINT user_role_check CHECK (role IN ('RM', 'Manager', 'Admin'));
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  dob DATE NOT NULL,
  pan_number TEXT NOT NULL,
  created_by_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  assigned_staff_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active',
  referral_code TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customers_status_check CHECK (status IN ('active', 'inactive', 'prospect'))
);

CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE RESTRICT,
  employee_code TEXT NOT NULL UNIQUE,
  designation TEXT NOT NULL,
  department TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS customer_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  from_staff_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  to_staff_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  changed_by_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "user" (email);
CREATE INDEX IF NOT EXISTS idx_session_userId ON "session" ("userId");
CREATE INDEX IF NOT EXISTS idx_account_userId ON "account" ("userId");
CREATE INDEX IF NOT EXISTS idx_user_investments_userId ON "user_investments" ("userId");
CREATE INDEX IF NOT EXISTS user_role_idx ON "user" (role);
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_key ON customers (email);
CREATE UNIQUE INDEX IF NOT EXISTS customers_pan_number_key ON customers (pan_number);
CREATE UNIQUE INDEX IF NOT EXISTS customers_referral_code_key ON customers (referral_code);
CREATE INDEX IF NOT EXISTS customers_created_by_id_idx ON customers (created_by_id);
CREATE INDEX IF NOT EXISTS customers_assigned_staff_id_idx ON customers (assigned_staff_id);
CREATE INDEX IF NOT EXISTS staff_profiles_status_idx ON staff_profiles (status);
CREATE INDEX IF NOT EXISTS customer_assignment_history_customer_idx ON customer_assignment_history (customer_id, changed_at);
CREATE INDEX IF NOT EXISTS customer_assignment_history_to_staff_idx ON customer_assignment_history (to_staff_id);

-- Keep Better Auth records inaccessible through Supabase's public Data API.
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_assignment_history ENABLE ROW LEVEL SECURITY;
