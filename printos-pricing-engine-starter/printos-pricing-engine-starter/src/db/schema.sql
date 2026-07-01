CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  group_name TEXT,
  gsm NUMERIC,
  base_price NUMERIC,
  paper_name TEXT,
  unit_price_m2 NUMERIC NOT NULL,
  plate_price NUMERIC,
  sheet_width_cm NUMERIC,
  sheet_height_cm NUMERIC,
  sheet_size_text TEXT,
  sheet_price NUMERIC,
  active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quantity_tiers (
  id TEXT PRIMARY KEY,
  module TEXT NOT NULL,
  label TEXT NOT NULL,
  min_qty NUMERIC,
  max_qty NUMERIC,
  value NUMERIC NOT NULL,
  unit TEXT,
  source_row INTEGER,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS process_prices (
  id TEXT PRIMARY KEY,
  process_code TEXT NOT NULL,
  process_name TEXT NOT NULL,
  base_price NUMERIC,
  unit_price NUMERIC,
  min_price NUMERIC,
  formula_type TEXT,
  note TEXT,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS quote_requests (
  id TEXT PRIMARY KEY,
  product_type TEXT NOT NULL,
  customer_name TEXT,
  quantity NUMERIC NOT NULL,
  width_cm NUMERIC,
  height_cm NUMERIC,
  material_id TEXT,
  options JSON,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quote_results (
  id TEXT PRIMARY KEY,
  quote_request_id TEXT NOT NULL,
  cost_total NUMERIC,
  cost_unit NUMERIC,
  sell_unit NUMERIC,
  sell_total NUMERIC,
  margin_rate NUMERIC,
  selected_method TEXT,
  breakdown JSON,
  alternatives JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
