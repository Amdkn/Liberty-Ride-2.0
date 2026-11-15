# SDD-TRIPLE-WORLD-UI — System Design Document : Architecture des 3 Mondes

## 1. Synchronisation d'État par EventBus & API Fichiers
Toute action dans `CustomerWorldView` (ex. réservation CVG) ou `DriverHouseTwinView` déclenche un événement dans `agentFileBridge.ts` qui met à jour en direct les tâches et les animations des agents dans `AdminVillageView`.
