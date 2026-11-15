# SDD-OPS-DISPATCH — System Design Document : Moteur de Dispatch Erlanger–CVG

## 1. Algorithme d'Affectation Flotte SUV
- Entrées : Coordonnées GPS des 3 SUV (`SUV-01 Liberty One`, `SUV-02 Bluegrass Exec`, `SUV-03 Queen City Black`), télémétrie vol CVG (FAA/FlightAware feed), fenêtre horaire réservée.
- Règle d'affectation : Sélection du véhicule minimisant le kilométrage à vide (*deadhead miles* < 18%) tout en garantissant un taux horaire net chauffeur `>= $45/h`.

## 2. Boucle de Service Recovery (< 90s)
En cas d'aléa mécanique ou de retard aérien, `b3-ops-dispatch` bascule automatiquement la course sur le SUV de réserve en Baie #3 et notifie le passager via SMS/Vapi.
