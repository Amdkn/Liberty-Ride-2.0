# SDD-FINOPS-LEDGER — System Design Document : Grand Livre & Verrous Financiers

## 1. Formule Canonique du Revenu Horaire Chauffeur
$$\text{NetHourlyUSD} = (\text{RidesPerHour} \times \text{AvgFareUSD} \times \text{DriverSharePercent}) + \text{AvgTipPerHourUSD} - \text{FuelAndMaintPerHourUSD}$$
- Seuil minimal d'alerte : `$45.00 / h`.
- Plafond de décaissement autonome sans Human Gate A0 : `$500.00 USD`.
