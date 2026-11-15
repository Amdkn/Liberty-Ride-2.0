import { Direction4, SceneLocationId } from '../../world-model/types';

export interface SeatAnchor {
  seatIndex: number;
  label: string;
  assignedAgentId?: string;
  x: number;
  y: number;
  facing: Direction4;
}

export interface BuildingDoorway {
  roomId: SceneLocationId;
  label: string;
  shortLabel: string;
  directorName: string;
  roofColor: string;
  facadeAssetUrl?: string;
  campusDoorX: number;
  campusDoorY: number;
  b2CampusStandX: number;
  b2CampusStandY: number;
  buildingBounds: { x: number; y: number; w: number; h: number };
}

/**
 * Exact coordinates calibrated on the Drive Overworld artwork
 * (campus-overworld-hd.webp — 1672x941 projected on 1280x720 Canvas)
 */
export const CAMPUS_BUILDING_DOORWAYS: BuildingDoorway[] = [
  {
    roomId: 'ROOM_00',
    label: '00 · City Hall Executive Boardroom',
    shortLabel: '00 · CITY HALL',
    directorName: 'A0 Amadeus & B1 Elena',
    roofColor: '#10B981',
    campusDoorX: 608,
    campusDoorY: 192,
    b2CampusStandX: 608,
    b2CampusStandY: 212,
    buildingBounds: { x: 460, y: 22, w: 295, h: 165 },
  },
  {
    roomId: 'ROOM_01',
    label: '01 · Operations & CVG Dispatch (Marcus Vance)',
    shortLabel: '01 · OPERATIONS',
    directorName: 'Marcus Vance',
    roofColor: '#00E5FF',
    facadeAssetUrl: '/assets/maps/facades/facade-01-operations.webp',
    campusDoorX: 342,
    campusDoorY: 248,
    b2CampusStandX: 342,
    b2CampusStandY: 266,
    buildingBounds: { x: 198, y: 92, w: 212, h: 150 },
  },
  {
    roomId: 'ROOM_02',
    label: '02 · Growth & AARRR Studio (Clara Morel)',
    shortLabel: '02 · GROWTH',
    directorName: 'Clara Morel',
    roofColor: '#00E676',
    facadeAssetUrl: '/assets/maps/facades/facade-02-growth.webp',
    campusDoorX: 846,
    campusDoorY: 232,
    b2CampusStandX: 846,
    b2CampusStandY: 250,
    buildingBounds: { x: 772, y: 78, w: 202, h: 148 },
  },
  {
    roomId: 'ROOM_03',
    label: '03 · Products & 3D Twin Lab (Liam Chen)',
    shortLabel: '03 · PRODUCTS',
    directorName: 'Liam Chen',
    roofColor: '#2979FF',
    facadeAssetUrl: '/assets/maps/facades/facade-03-products.webp',
    campusDoorX: 264,
    campusDoorY: 392,
    b2CampusStandX: 264,
    b2CampusStandY: 410,
    buildingBounds: { x: 88, y: 244, w: 242, h: 146 },
  },
  {
    roomId: 'ROOM_04',
    label: '04 · Sales & $100M B2B Lounge (Sofia Alverez)',
    shortLabel: '04 · SALES',
    directorName: 'Sofia Alverez',
    roofColor: '#FF6D00',
    facadeAssetUrl: '/assets/maps/facades/facade-04-sales.webp',
    campusDoorX: 885,
    campusDoorY: 364,
    b2CampusStandX: 885,
    b2CampusStandY: 382,
    buildingBounds: { x: 815, y: 244, w: 175, h: 118 },
  },
  {
    roomId: 'ROOM_05',
    label: '05 · Finance & Treasury Vault (Arthur Sterling)',
    shortLabel: '05 · FINANCE',
    directorName: 'Arthur Sterling',
    roofColor: '#FFD600',
    facadeAssetUrl: '/assets/maps/facades/facade-05-finance.webp',
    campusDoorX: 285,
    campusDoorY: 548,
    b2CampusStandX: 285,
    b2CampusStandY: 566,
    buildingBounds: { x: 88, y: 410, w: 246, h: 140 },
  },
  {
    roomId: 'ROOM_06',
    label: '06 · Legal & KYTC Compliance (Nadia Benali)',
    shortLabel: '06 · LEGAL',
    directorName: 'Nadia Benali',
    roofColor: '#ECEFF1',
    facadeAssetUrl: '/assets/maps/facades/facade-06-legal.webp',
    campusDoorX: 522,
    campusDoorY: 576,
    b2CampusStandX: 522,
    b2CampusStandY: 594,
    buildingBounds: { x: 386, y: 446, w: 212, h: 130 },
  },
  {
    roomId: 'ROOM_07',
    label: '07 · IT, Cloud & SRE Core (Viktor Kovács)',
    shortLabel: '07 · IT & SRE',
    directorName: 'Viktor Kovács',
    roofColor: '#D500F9',
    facadeAssetUrl: '/assets/maps/facades/facade-07-it.webp',
    campusDoorX: 814,
    campusDoorY: 574,
    b2CampusStandX: 814,
    b2CampusStandY: 592,
    buildingBounds: { x: 672, y: 432, w: 218, h: 142 },
  },
  {
    roomId: 'ROOM_08',
    label: '08 · People & Driver Academy (Maya Lin)',
    shortLabel: '08 · PEOPLE',
    directorName: 'Maya Lin',
    roofColor: '#FF4081',
    facadeAssetUrl: '/assets/maps/facades/facade-08-people.webp',
    campusDoorX: 986,
    campusDoorY: 538,
    b2CampusStandX: 986,
    b2CampusStandY: 556,
    buildingBounds: { x: 916, y: 410, w: 268, h: 132 },
  },
];

/**
 * Exact coordinates calibrated on Drive Room 00 artwork (room-00-city-hall.webp — 1280x720)
 * matching the 15 green leather armchairs around the central miniature village table
 * plus the Top-Left Executive Desk (#15).
 */
export const CITY_HALL_15_SEATS: SeatAnchor[] = [
  // North Row (Facing the miniature village table)
  { seatIndex: 1, label: 'Fauteuil #01 — A0 Amadeus (Présidence)', assignedAgentId: 'a0-amadeus', x: 640, y: 298, facing: 'DOWN' },
  { seatIndex: 2, label: 'Fauteuil #02 — B1 Elena Rostova (CEO)', assignedAgentId: 'b1-ceo-chief-of-staff', x: 548, y: 304, facing: 'DOWN' },
  { seatIndex: 3, label: 'Fauteuil #03 — B2-01 Marcus Vance (Ops)', assignedAgentId: 'b2-01-operations', x: 732, y: 304, facing: 'DOWN' },
  { seatIndex: 4, label: 'Fauteuil #04 — B2-02 Clara Morel (Growth)', assignedAgentId: 'b2-02-growth', x: 458, y: 320, facing: 'DOWN' },
  { seatIndex: 5, label: 'Fauteuil #05 — B2-03 Liam Chen (Products)', assignedAgentId: 'b2-03-products', x: 822, y: 320, facing: 'DOWN' },
  // West Curve of Oval Table (Profile Right)
  { seatIndex: 6, label: 'Fauteuil #06 — B2-04 Sofia Alverez (Sales)', assignedAgentId: 'b2-04-sales', x: 362, y: 388, facing: 'RIGHT' },
  { seatIndex: 7, label: 'Fauteuil #07 — B2-05 Arthur Sterling (Finance)', assignedAgentId: 'b2-05-finance', x: 362, y: 466, facing: 'RIGHT' },
  // East Curve of Oval Table (Profile Left)
  { seatIndex: 8, label: 'Fauteuil #08 — B2-06 Nadia Benali (Legal)', assignedAgentId: 'b2-06-legal', x: 918, y: 388, facing: 'LEFT' },
  { seatIndex: 9, label: 'Fauteuil #09 — B2-07 Viktor Kovács (IT)', assignedAgentId: 'b2-07-it', x: 918, y: 466, facing: 'LEFT' },
  // South Row of Oval Table
  { seatIndex: 10, label: 'Fauteuil #10 — B2-08 Maya Lin (People)', assignedAgentId: 'b2-08-people', x: 458, y: 542, facing: 'UP' },
  { seatIndex: 11, label: 'Fauteuil #11 — Conseil Audit #1', x: 548, y: 554, facing: 'UP' },
  { seatIndex: 12, label: 'Fauteuil #12 — Conseil Audit #2', x: 640, y: 558, facing: 'UP' },
  { seatIndex: 13, label: 'Fauteuil #13 — Conseil Audit #3', x: 732, y: 554, facing: 'UP' },
  { seatIndex: 14, label: 'Fauteuil #14 — Conseil Audit #4', x: 822, y: 542, facing: 'UP' },
  // Top-Left Curved Wooden Executive Desk in Room 00
  { seatIndex: 15, label: 'Fauteuil #15 — Bureau Exécutif B1 (Haut-Gauche)', x: 318, y: 238, facing: 'DOWN' },
];

export interface DomainRoomAnchors {
  roomId: SceneLocationId;
  centerpieceLabel: string;
  b2DeskSeat: { x: number; y: number; facing: Direction4 };
  b3Workbench: { x: number; y: number; facing: Direction4 };
  b3CenterTablePoint: { x: number; y: number; facing: Direction4 };
  b3ReceiptDeliveryPoint: { x: number; y: number; facing: Direction4 };
  interiorExitDoor: { x: number; y: number };
}

/**
 * Exact coordinates calibrated on the 8 HD Interior Room artworks (room-01..08.webp — 1280x720):
 * - Top-Left Curved Wooden Executive Desk is at (x: ~345, y: ~245) in all 8 rooms.
 * - Domain Centerpiece / Hologram / Studio is on the center-right (x: ~620..940, y: ~375..430).
 * - B3 Receipt Delivery Point is right in front of the Top-Left B2 Desk (x: 430, y: 285).
 * - Southern Arched Exit Doors are at (x: 640, y: 662).
 */
export const DOMAIN_ROOM_ANCHORS: Record<Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>, DomainRoomAnchors> = {
  ROOM_01: {
    roomId: 'ROOM_01',
    centerpieceLabel: 'Table Holographique Corridor Erlanger ↔ CVG',
    b2DeskSeat: { x: 342, y: 246, facing: 'DOWN' },
    b3Workbench: { x: 645, y: 425, facing: 'UP' },
    b3CenterTablePoint: { x: 930, y: 375, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 425, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_02: {
    roomId: 'ROOM_02',
    centerpieceLabel: 'Studio Podcast ON AIR & Table AARRR',
    b2DeskSeat: { x: 345, y: 248, facing: 'DOWN' },
    b3Workbench: { x: 940, y: 505, facing: 'LEFT' },
    b3CenterTablePoint: { x: 620, y: 415, facing: 'UP' },
    b3ReceiptDeliveryPoint: { x: 428, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_03: {
    roomId: 'ROOM_03',
    centerpieceLabel: 'Podium Hologramme SUV Bleu & Kanban SDD',
    b2DeskSeat: { x: 345, y: 248, facing: 'DOWN' },
    b3Workbench: { x: 925, y: 395, facing: 'RIGHT' },
    b3CenterTablePoint: { x: 585, y: 420, facing: 'UP' },
    b3ReceiptDeliveryPoint: { x: 428, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_04: {
    roomId: 'ROOM_04',
    centerpieceLabel: 'Gong Doré B2B & Salon Partenaires CVG',
    b2DeskSeat: { x: 342, y: 246, facing: 'DOWN' },
    b3Workbench: { x: 925, y: 365, facing: 'RIGHT' },
    b3CenterTablePoint: { x: 615, y: 415, facing: 'UP' },
    b3ReceiptDeliveryPoint: { x: 426, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_05: {
    roomId: 'ROOM_05',
    centerpieceLabel: 'Porte Coffre-Fort Or & Table Unit Economics ($45/h)',
    b2DeskSeat: { x: 346, y: 246, facing: 'DOWN' },
    b3Workbench: { x: 915, y: 385, facing: 'RIGHT' },
    b3CenterTablePoint: { x: 615, y: 425, facing: 'UP' },
    b3ReceiptDeliveryPoint: { x: 428, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_06: {
    roomId: 'ROOM_06',
    centerpieceLabel: 'Table Balance de la Justice & Blason KYTC',
    b2DeskSeat: { x: 344, y: 246, facing: 'DOWN' },
    b3Workbench: { x: 640, y: 430, facing: 'UP' },
    b3CenterTablePoint: { x: 915, y: 385, facing: 'RIGHT' },
    b3ReceiptDeliveryPoint: { x: 426, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_07: {
    roomId: 'ROOM_07',
    centerpieceLabel: 'Cœur Serveur Quantique & Conduites Cuivre',
    b2DeskSeat: { x: 345, y: 248, facing: 'DOWN' },
    b3Workbench: { x: 915, y: 395, facing: 'RIGHT' },
    b3CenterTablePoint: { x: 575, y: 420, facing: 'UP' },
    b3ReceiptDeliveryPoint: { x: 428, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
  ROOM_08: {
    roomId: 'ROOM_08',
    centerpieceLabel: 'Studio Cyclorama Blanc & Ring Light Academy',
    b2DeskSeat: { x: 345, y: 248, facing: 'DOWN' },
    b3Workbench: { x: 925, y: 405, facing: 'RIGHT' },
    b3CenterTablePoint: { x: 575, y: 420, facing: 'UP' },
    b3ReceiptDeliveryPoint: { x: 428, y: 286, facing: 'LEFT' },
    interiorExitDoor: { x: 640, y: 662 },
  },
};

export function findCityHallSeatForAgent(agentId: string): SeatAnchor {
  return (
    CITY_HALL_15_SEATS.find((s) => s.assignedAgentId === agentId) ||
    CITY_HALL_15_SEATS[10]
  );
}
