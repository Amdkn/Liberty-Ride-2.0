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
  roofColor: string;
  campusDoorX: number;
  campusDoorY: number;
  buildingBounds: { x: number; y: number; w: number; h: number };
}

/**
 * Exact coordinates calibrated on the Drive Overworld PNG (campus-overworld-hd.png — 1280x720)
 */
export const CAMPUS_BUILDING_DOORWAYS: BuildingDoorway[] = [
  {
    roomId: 'ROOM_00',
    label: '00 · City Hall (B1 CEO)',
    roofColor: '#10B981',
    campusDoorX: 605,
    campusDoorY: 195,
    buildingBounds: { x: 455, y: 24, w: 300, h: 165 },
  },
  {
    roomId: 'ROOM_01',
    label: '01 · Operations (Marcus)',
    roofColor: '#00E5FF',
    campusDoorX: 345,
    campusDoorY: 255,
    buildingBounds: { x: 195, y: 95, w: 215, h: 155 },
  },
  {
    roomId: 'ROOM_02',
    label: '02 · Growth (Clara)',
    roofColor: '#00E676',
    campusDoorX: 845,
    campusDoorY: 235,
    buildingBounds: { x: 770, y: 80, w: 205, h: 150 },
  },
  {
    roomId: 'ROOM_03',
    label: '03 · Products (Liam)',
    roofColor: '#2979FF',
    campusDoorX: 265,
    campusDoorY: 395,
    buildingBounds: { x: 85, y: 245, w: 245, h: 150 },
  },
  {
    roomId: 'ROOM_04',
    label: '04 · Sales (Sofia)',
    roofColor: '#FF6D00',
    campusDoorX: 885,
    campusDoorY: 365,
    buildingBounds: { x: 815, y: 245, w: 175, h: 120 },
  },
  {
    roomId: 'ROOM_05',
    label: '05 · Finance (Arthur)',
    roofColor: '#FFD600',
    campusDoorX: 285,
    campusDoorY: 545,
    buildingBounds: { x: 85, y: 410, w: 250, h: 145 },
  },
  {
    roomId: 'ROOM_06',
    label: '06 · Legal KYTC (Nadia)',
    roofColor: '#ECEFF1',
    campusDoorX: 525,
    campusDoorY: 575,
    buildingBounds: { x: 385, y: 445, w: 215, h: 135 },
  },
  {
    roomId: 'ROOM_07',
    label: '07 · IT & SRE (Viktor)',
    roofColor: '#D500F9',
    campusDoorX: 815,
    campusDoorY: 575,
    buildingBounds: { x: 670, y: 430, w: 220, h: 145 },
  },
  {
    roomId: 'ROOM_08',
    label: '08 · People Academy (Maya)',
    roofColor: '#FF4081',
    campusDoorX: 985,
    campusDoorY: 535,
    buildingBounds: { x: 915, y: 410, w: 270, h: 135 },
  },
];

/**
 * Exact coordinates calibrated on Drive Room 00 PNG (room-00-city-hall.png — 1280x720)
 * around the central miniature village table + 15 leather armchairs
 */
export const CITY_HALL_15_SEATS: SeatAnchor[] = [
  // Head of Table (North Center) — A0 Amadeus Sovereign Chair
  { seatIndex: 1, label: 'Fauteuil #01 — A0 Amadeus', assignedAgentId: 'a0-amadeus', x: 640, y: 262, facing: 'DOWN' },
  // North Row (Left & Right of A0)
  { seatIndex: 2, label: 'Fauteuil #02 — B1 Elena Rostova', assignedAgentId: 'b1-ceo-chief-of-staff', x: 545, y: 278, facing: 'DOWN' },
  { seatIndex: 3, label: 'Fauteuil #03 — B2-01 Marcus (Ops)', assignedAgentId: 'b2-01-operations', x: 735, y: 278, facing: 'DOWN' },
  { seatIndex: 4, label: 'Fauteuil #04 — B2-02 Clara (Growth)', assignedAgentId: 'b2-02-growth', x: 465, y: 278, facing: 'DOWN' },
  { seatIndex: 5, label: 'Fauteuil #05 — B2-03 Liam (Products)', assignedAgentId: 'b2-03-products', x: 815, y: 278, facing: 'DOWN' },
  // West Flank
  { seatIndex: 6, label: 'Fauteuil #06 — B2-04 Sofia (Sales)', assignedAgentId: 'b2-04-sales', x: 335, y: 365, facing: 'RIGHT' },
  { seatIndex: 7, label: 'Fauteuil #07 — B2-05 Arthur (Finance)', assignedAgentId: 'b2-05-finance', x: 315, y: 455, facing: 'RIGHT' },
  // East Flank
  { seatIndex: 8, label: 'Fauteuil #08 — B2-06 Nadia (Legal)', assignedAgentId: 'b2-06-legal', x: 945, y: 365, facing: 'LEFT' },
  { seatIndex: 9, label: 'Fauteuil #09 — B2-07 Viktor (IT)', assignedAgentId: 'b2-07-it', x: 965, y: 455, facing: 'LEFT' },
  // South Row (Facing the miniature village table)
  { seatIndex: 10, label: 'Fauteuil #10 — B2-08 Maya (People)', assignedAgentId: 'b2-08-people', x: 435, y: 542, facing: 'UP' },
  { seatIndex: 11, label: 'Fauteuil #11 — Invité Audit #1', x: 535, y: 542, facing: 'UP' },
  { seatIndex: 12, label: 'Fauteuil #12 — Invité Audit #2', x: 640, y: 542, facing: 'UP' },
  { seatIndex: 13, label: 'Fauteuil #13 — Invité Audit #3', x: 745, y: 542, facing: 'UP' },
  { seatIndex: 14, label: 'Fauteuil #14 — Invité Audit #4', x: 845, y: 542, facing: 'UP' },
  // Executive Curved Desk at Top-Left of Room 00
  { seatIndex: 15, label: 'Fauteuil #15 — Bureau Exécutif B1', x: 270, y: 195, facing: 'DOWN' },
];

export interface DomainRoomAnchors {
  roomId: SceneLocationId;
  b2DeskSeat: { x: number; y: number; facing: Direction4 };
  b3Workbench: { x: number; y: number; facing: Direction4 };
  b3ReceiptDeliveryPoint: { x: number; y: number; facing: Direction4 };
  interiorExitDoor: { x: number; y: number };
}

/**
 * Exact desk & SOP station anchors inside Rooms 01 to 08 (1280x720)
 */
export const DOMAIN_ROOM_ANCHORS: Record<Exclude<SceneLocationId, 'CAMPUS' | 'ROOM_00'>, DomainRoomAnchors> = {
  ROOM_01: {
    roomId: 'ROOM_01',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_02: {
    roomId: 'ROOM_02',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_03: {
    roomId: 'ROOM_03',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_04: {
    roomId: 'ROOM_04',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_05: {
    roomId: 'ROOM_05',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_06: {
    roomId: 'ROOM_06',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_07: {
    roomId: 'ROOM_07',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
  ROOM_08: {
    roomId: 'ROOM_08',
    b2DeskSeat: { x: 640, y: 275, facing: 'DOWN' },
    b3Workbench: { x: 910, y: 420, facing: 'LEFT' },
    b3ReceiptDeliveryPoint: { x: 520, y: 340, facing: 'RIGHT' },
    interiorExitDoor: { x: 640, y: 660 },
  },
};

export function findCityHallSeatForAgent(agentId: string): SeatAnchor {
  return (
    CITY_HALL_15_SEATS.find((s) => s.assignedAgentId === agentId) ||
    CITY_HALL_15_SEATS[10]
  );
}
