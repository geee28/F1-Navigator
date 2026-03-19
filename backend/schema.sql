-- F1 Navigator — PostgreSQL schema
-- Run this once after creating your Render database.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Student profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID        UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name             VARCHAR(255),
    university       VARCHAR(255),
    major            VARCHAR(255),
    degree_level     VARCHAR(50),   -- Bachelor, Master, PhD, Other
    year_of_study    VARCHAR(50),   -- "Year 1", "Year 2", etc.
    visa_status      VARCHAR(50),   -- F-1, OPT, STEM-OPT, H-1B, Other
    country_of_origin VARCHAR(100),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Documents ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    doc_type    VARCHAR(100),          -- I-20, EAD, Passport, etc.
    file_data   TEXT,                  -- base64 DataURL
    file_size   INTEGER DEFAULT 0,     -- bytes
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── ISO Meeting requests ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID        REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(255) NOT NULL,
    email          VARCHAR(255) NOT NULL,
    preferred_date DATE,
    preferred_time TIME,
    topic          VARCHAR(100),
    details        TEXT,
    status         VARCHAR(50) DEFAULT 'pending',  -- pending | confirmed
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user  ON meetings(user_id);
