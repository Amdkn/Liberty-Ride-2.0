-- =============================================================================
-- 001_world_model_core.sql
-- Liberty Ride 2.0 (LD01) — A'Space OS Core World Model & Corridor Schema
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Fleet Vehicles (3 Executive Black SUVs at Erlanger Hub)
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id TEXT PRIMARY KEY,
  callsign TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT UNIQUE NOT NULL,
  bay_number INTEGER NOT NULL CHECK (bay_number BETWEEN 1 AND 3),
  status TEXT NOT NULL DEFAULT 'READY' CHECK (status IN ('READY', 'EN_ROUTE', 'CHARGING', 'MAINTENANCE')),
  battery_percent INTEGER NOT NULL DEFAULT 95,
  kytc_permit_valid BOOLEAN NOT NULL DEFAULT TRUE,
  cvg_avi_badge_valid BOOLEAN NOT NULL DEFAULT TRUE,
  commercial_insurance_valid BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Corridor Ride Bookings (Erlanger <-> CVG Airport <-> Downtown Cincinnati)
CREATE TABLE IF NOT EXISTS public.ride_bookings (
  id TEXT PRIMARY KEY,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  pickup_zone TEXT NOT NULL,
  dropoff_zone TEXT NOT NULL,
  flight_number TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('WEB_PORTAL', 'VAPI_VOICE', 'B2B_HOTEL')),
  fare_usd NUMERIC(10, 2) NOT NULL,
  driver_net_usd NUMERIC(10, 2) NOT NULL,
  assigned_vehicle_id TEXT REFERENCES public.fleet_vehicles(id),
  status TEXT NOT NULL DEFAULT 'DISPATCHED' CHECK (status IN ('PENDING', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'RECOVERY')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Sovereign A0 Human Gates Registry
CREATE TABLE IF NOT EXISTS public.human_gates (
  gate_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  description TEXT NOT NULL,
  threshold_rule TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED', 'APPROVED_BY_A0', 'REJECTED_BY_A0')),
  last_signed_by TEXT DEFAULT 'a0-amadeus',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.human_gates ENABLE ROW LEVEL SECURITY;
