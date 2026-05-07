-- ============================================================
-- RentPro Database Schema — Complete v5
-- ============================================================

CREATE TABLE IF NOT EXISTS id_counters (
  name   VARCHAR(50) PRIMARY KEY,
  value  INTEGER DEFAULT 0
);
INSERT INTO id_counters (name,value) VALUES ('landlord',0),('tenant',0),('property',0)
  ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password        VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'landlord',
  ref_id          VARCHAR(20),
  must_change_pwd BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS landlords (
  id           VARCHAR(10) PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  phone        VARCHAR(20),
  city         VARCHAR(100),
  plan         VARCHAR(20) DEFAULT 'basic',
  status       VARCHAR(20) DEFAULT 'active',
  plan_expiry  DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  currency     VARCHAR(10) DEFAULT 'INR',
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS properties (
  id              VARCHAR(10) PRIMARY KEY,
  landlord_id     VARCHAR(10) REFERENCES landlords(id) ON DELETE CASCADE,
  name            VARCHAR(255) NOT NULL,
  address         TEXT,
  city            VARCHAR(100),
  rent            INTEGER NOT NULL,
  status          VARCHAR(20) DEFAULT 'vacant',
  -- Property details
  property_type   VARCHAR(50),
  bhk             VARCHAR(20),
  total_rooms     INTEGER,
  floor_details   VARCHAR(100),
  total_floors    INTEGER,
  furnishing      VARCHAR(50),
  area_sqft       INTEGER,
  facing          VARCHAR(30),
  parking         VARCHAR(50),
  -- Marketplace extras
  listed          BOOLEAN DEFAULT FALSE,
  amenities       TEXT,
  available_from  DATE,
  max_adults      INTEGER DEFAULT 2,
  description     TEXT,
  house_rules     TEXT,
  security_deposit INTEGER,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS property_images (
  id           SERIAL PRIMARY KEY,
  property_id  VARCHAR(10) REFERENCES properties(id) ON DELETE CASCADE,
  filename     VARCHAR(500) NOT NULL,
  url          VARCHAR(500) NOT NULL,
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tenants (
  id             VARCHAR(20) PRIMARY KEY,
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  landlord_id    VARCHAR(10) REFERENCES landlords(id),
  property_id    VARCHAR(10) REFERENCES properties(id),
  name           VARCHAR(255) NOT NULL,
  email          VARCHAR(255),
  phone          VARCHAR(20),
  rent           INTEGER,
  lease_start    DATE,
  lease_end      DATE,
  pay_status     VARCHAR(20) DEFAULT 'paid',
  status         VARCHAR(20) DEFAULT 'active',
  contract_doc   VARCHAR(500),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id           SERIAL PRIMARY KEY,
  tenant_id    VARCHAR(20) REFERENCES tenants(id),
  property_id  VARCHAR(10) REFERENCES properties(id),
  landlord_id  VARCHAR(10) REFERENCES landlords(id),
  amount       INTEGER NOT NULL,
  month        VARCHAR(20),
  method       VARCHAR(50) DEFAULT 'manual',
  status       VARCHAR(20) DEFAULT 'paid',
  remark       TEXT,
  paid_at      TIMESTAMP DEFAULT NOW()
);

-- Cash payment requests (pending landlord confirmation)
CREATE TABLE IF NOT EXISTS cash_payment_requests (
  id           SERIAL PRIMARY KEY,
  tenant_id    VARCHAR(20) REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id  VARCHAR(10) REFERENCES landlords(id),
  property_id  VARCHAR(10) REFERENCES properties(id),
  amount       INTEGER NOT NULL,
  month        VARCHAR(20),
  status       VARCHAR(20) DEFAULT 'pending',
  landlord_remark TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  resolved_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS change_requests (
  id             SERIAL PRIMARY KEY,
  tenant_id      VARCHAR(20) REFERENCES tenants(id) ON DELETE CASCADE,
  landlord_id    VARCHAR(10) REFERENCES landlords(id),
  field_name     VARCHAR(50) NOT NULL,
  old_value      VARCHAR(255),
  new_value      VARCHAR(255) NOT NULL,
  status         VARCHAR(20) DEFAULT 'pending',
  created_at     TIMESTAMP DEFAULT NOW(),
  resolved_at    TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(50) NOT NULL,
  title        VARCHAR(255) NOT NULL,
  message      TEXT,
  read         BOOLEAN DEFAULT FALSE,
  ref_id       VARCHAR(50),
  created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings (
  id            SERIAL PRIMARY KEY,
  property_id   VARCHAR(10) REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id   VARCHAR(10) REFERENCES landlords(id),
  listed_at     TIMESTAMP DEFAULT NOW(),
  unlisted_at   TIMESTAMP,
  status        VARCHAR(20) DEFAULT 'active',
  UNIQUE(property_id)
);

CREATE TABLE IF NOT EXISTS property_views (
  id           SERIAL PRIMARY KEY,
  property_id  VARCHAR(10) REFERENCES properties(id) ON DELETE CASCADE,
  viewed_at    TIMESTAMP DEFAULT NOW(),
  ip_hash      VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS enquiries (
  id               SERIAL PRIMARY KEY,
  property_id      VARCHAR(10) REFERENCES properties(id) ON DELETE CASCADE,
  landlord_id      VARCHAR(10) REFERENCES landlords(id),
  name             VARCHAR(255) NOT NULL,
  email            VARCHAR(255) NOT NULL,
  phone            VARCHAR(30),
  move_in_date     DATE,
  message          TEXT,
  status           VARCHAR(30) DEFAULT 'new',
  payment_ref      VARCHAR(100),
  payment_amount   INTEGER,
  payment_note     TEXT,
  onboarded_at     TIMESTAMP,
  tenant_id        VARCHAR(20),
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW()
);

-- Seed admin (password = 'password', update after first start)
INSERT INTO users (email,password,role,ref_id)
  VALUES ('admin@rentpro.in','$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin','ADMIN001')
  ON CONFLICT (email) DO NOTHING;
