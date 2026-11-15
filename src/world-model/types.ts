export type ExperienceId = 'ADMIN_VILLAGE' | 'DRIVER_HOUSE_3D' | 'CUSTOMER_WORLD';

export type AgentTier = 'A0' | 'B1' | 'B2' | 'B3';

export type DomainId =
  | 'SOVEREIGN'
  | 'EXECUTIVE'
  | 'OPERATIONS'
  | 'GROWTH'
  | 'PRODUCTS'
  | 'SALES'
  | 'FINANCE'
  | 'LEGAL'
  | 'IT'
  | 'PEOPLE';

export type SceneLocationId =
  | 'CAMPUS'
  | 'ROOM_00'
  | 'ROOM_01'
  | 'ROOM_02'
  | 'ROOM_03'
  | 'ROOM_04'
  | 'ROOM_05'
  | 'ROOM_06'
  | 'ROOM_07'
  | 'ROOM_08';

export type PostureState =
  | 'NORMAL_HOODY'
  | 'UNBLOCK_HULK'
  | 'WALK_FOLLOW'
  | 'PHONE_DISPATCH'
  | 'STANDING'
  | 'SEATED'
  | 'REVIEWING_RECEIPT'
  | 'EXECUTING_SOP'
  | 'SUBMITTING_RECEIPT';

export type Direction4 = 'DOWN' | 'LEFT' | 'RIGHT' | 'UP';

export type TaskStatus =
  | 'PENDING'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'REJECTED_ONCE'
  | 'BLOCKED_2X';

export type HumanGateId =
  | 'GATE_KYTC_FILING'
  | 'GATE_FLEET_INSURANCE'
  | 'GATE_CVG_PRICING'
  | 'GATE_TREASURY_500'
  | 'GATE_B2B_CONTRACTS';

export interface HumanGateRecord {
  id: HumanGateId;
  title: string;
  domain: DomainId;
  description: string;
  thresholdRule: string;
  status: 'LOCKED' | 'APPROVED_BY_A0' | 'REJECTED_BY_A0';
  lastSignedAt: string;
  signatureHash?: string;
}

export interface TaskRecord {
  id: string;
  title: string;
  domain: DomainId;
  ownerB2: string;
  workerB3: string;
  status: TaskStatus;
  rejectionCount: number;
  requiresHumanGate: boolean;
  humanGateId?: HumanGateId;
  acceptanceCriteria: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptRecord {
  id: string;
  taskId: string;
  agentId: string;
  verifiedBy: string;
  timestamp: string;
  summary: string;
  metrics: Record<string, number | string>;
  hash: string;
}

export interface AgentNode {
  id: string;
  name: string;
  roleTitle: string;
  tier: AgentTier;
  domain: DomainId;
  homeRoom: SceneLocationId;
  currentLocation: SceneLocationId;
  roofColor: string;
  supervisorId?: string;
  workerId?: string;
  folderPath: string;
  posture: PostureState;
  direction: Direction4;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speedMultiplier: number;
  speechBubble?: string;
  speechBubbleUntil?: number;
  standingSpriteKey: string;
  altSpriteKey: string;
  agentMd: string;
  notesMd: string;
  specs: Record<string, string>;
  tasks: TaskRecord[];
  receipts: ReceiptRecord[];
}

export type FloorSlicerMode =
  | 'FULL_BUILDING'
  | 'CUTAWAY_UP_TO'
  | 'FLOOR_ISOLATE'
  | 'EXPLODED_STACK'
  | 'XRAY';

export type CrossCuttingFilterId = 'ALL' | 'FLEET_OPS' | 'COMPLIANCE_KYTC' | 'FINOPS_45HR' | 'AI_DISPATCH';

export interface RideBooking {
  id: string;
  passengerName: string;
  passengerPhone: string;
  pickupZone: 'ERLANGER_HUB' | 'CVG_TERMINAL' | 'CINCINNATI_DOWNTOWN' | 'COVINGTON_RIVERFRONT';
  dropoffZone: 'ERLANGER_HUB' | 'CVG_TERMINAL' | 'CINCINNATI_DOWNTOWN' | 'COVINGTON_RIVERFRONT';
  flightNumber: string;
  channel: 'WEB_PORTAL' | 'VAPI_VOICE' | 'B2B_HOTEL';
  fareUsd: number;
  driverNetUsd: number;
  estimatedMinutes: number;
  assignedSuv: 'SUV-01 Liberty One' | 'SUV-02 Bluegrass Exec' | 'SUV-03 Queen City Black';
  status: 'DISPATCHED' | 'EN_ROUTE' | 'COMPLETED';
  createdAt: string;
}
