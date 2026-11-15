-- =============================================================================
-- seed.sql — Canonical Initial State for Liberty Ride 2.0 (LD01)
-- =============================================================================

INSERT INTO public.fleet_vehicles (id, callsign, model, vin, bay_number, status, battery_percent, kytc_permit_valid, cvg_avi_badge_valid, commercial_insurance_valid)
VALUES
  ('SUV-01', 'Liberty One', 'Cadillac Escalade ESV Black', '1GYS4HKJ0LR001101', 1, 'READY', 98, TRUE, TRUE, TRUE),
  ('SUV-02', 'Bluegrass Exec', 'Chevrolet Suburban High Country', '1GNSKCKD9MR002202', 2, 'EN_ROUTE', 89, TRUE, TRUE, TRUE),
  ('SUV-03', 'Queen City Black', 'GMC Yukon XL Denali', '1GKS2JKL4PR003303', 3, 'READY', 100, TRUE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.human_gates (gate_id, title, domain, description, threshold_rule, status)
VALUES
  ('GATE_KYTC_FILING', 'Soumission Réglementaire KYTC', 'LEGAL', 'Dépôt officiel des licences de transport de personnes auprès du Kentucky Transportation Cabinet.', 'Signature souveraine A0 obligatoire', 'APPROVED_BY_A0'),
  ('GATE_FLEET_INSURANCE', 'Polices Assurance Commerciale Flotte', 'LEGAL', 'Souscription ou modification des polices $1M CSL pour les 3 SUV.', 'Signature souveraine A0 obligatoire', 'APPROVED_BY_A0'),
  ('GATE_CVG_PRICING', 'Grille Tarifaire Officielle Erlanger / CVG', 'FINANCE', 'Modification des forfaits publics Erlanger <-> CVG ($48) et CVG <-> Cincinnati ($65).', 'Revenu chauffeur >= $45/h + Signature A0', 'LOCKED'),
  ('GATE_TREASURY_500', 'Décaissement Trésorerie > $500 USD', 'FINANCE', 'Tout paiement fournisseur ou engagement financier unitaire supérieur à $500.', 'Verrou automatique > $500 USD', 'LOCKED'),
  ('GATE_B2B_CONTRACTS', 'Signature Contrats B2B Hôtels & Corporate', 'SALES', 'Engagement contractuel pluriannuel avec les hôtels CVG et entreprises de Cincinnati.', 'Signature souveraine A0 obligatoire', 'LOCKED')
ON CONFLICT (gate_id) DO NOTHING;
