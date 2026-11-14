-- Hair'itage Loyalty System — Database Schema
-- Run this in Supabase SQL Editor

-- Customers
CREATE TABLE customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  phone      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Loyalty cards (one per customer per type)
CREATE TABLE loyalty_cards (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (type IN ('homme', 'coiffure', 'esthetique')),
  stamps              INT NOT NULL DEFAULT 0,
  apple_pass_serial   TEXT UNIQUE,
  apple_device_token  TEXT,
  apple_push_token    TEXT,
  google_pass_id      TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE (customer_id, type)
);

-- Transaction history
CREATE TABLE transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id    UUID NOT NULL REFERENCES loyalty_cards(id) ON DELETE CASCADE,
  action     TEXT NOT NULL CHECK (action IN ('stamp_added', 'gift_redeemed', 'card_created')),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cards_customer ON loyalty_cards(customer_id);
CREATE INDEX idx_cards_serial ON loyalty_cards(apple_pass_serial);
CREATE INDEX idx_transactions_card ON transactions(card_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);
CREATE INDEX idx_customers_phone ON customers(phone);

-- RLS (Row Level Security) — service role key bypasses this
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Only allow reads/writes via service role (our API)
-- Public (anon) has no access — all mutations go through our API endpoints
CREATE POLICY "Service role only" ON customers USING (false);
CREATE POLICY "Service role only" ON loyalty_cards USING (false);
CREATE POLICY "Service role only" ON transactions USING (false);
