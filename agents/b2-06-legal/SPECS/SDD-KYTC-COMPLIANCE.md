# SDD-KYTC-COMPLIANCE — System Design Document : Coffre-Fort Réglementaire KYTC

## 1. Contrôles Obligatoires Avant Dispatch
Aucun SUV ne peut être assigné par `b3-ops-dispatch` si l'un des 3 verrous suivants est expiré :
1. Autorisation KYTC Kentucky Passenger Carrier.
2. Police d'assurance commerciale active (`GATE_FLEET_INSURANCE`).
3. Transpondeur AVI CVG Airport Ground Transportation.
