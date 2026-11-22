export type SecurityKind =
  | "EQUITY"
  | "CCPS"
  | "CCD"
  | "CONVERTIBLE_NOTE"
  | "ISAFE"
  | "WARRANT";

export type ShareholderType = "FOUNDER" | "INVESTOR" | "EMPLOYEE" | "OTHER";

export type MovementKind = "ALLOTMENT" | "TRANSFER" | "CONVERSION" | "BUYBACK";

export type WorkspaceInfo = {
  id: string;
  name: string;
  status: "ACTIVE" | "EXPIRED";
  expiresAt: string;
  holderLimit: number;
  companyType: "PRIVATE_LIMITED" | "UNLISTED_PUBLIC";
  cin: string | null;
  incorporationDate: string | null;
  dpiitRecognised: boolean | null;
  /** IN = India, US = United States. Older workspaces without it are India. */
  jurisdiction?: "IN" | "US";
  usStateOfIncorporation?: string | null;
  currentFmvPerShare: number | null;
  fmvValuationDate: string | null;
  fmvValuerName: string | null;
};

export type GrantLinkStatus = {
  id: string;
  hasPasscode: boolean;
  expiresAt: string;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
  locked: boolean;
};

export type SecurityClassRow = {
  id: string;
  name: string;
  kind: SecurityKind;
  faceValue: number | null;
  conversionRatio: number | null;
  liqPrefMultiple: number | null;
  participating: boolean | null;
  valuationCap: number | null;
  discountPct: number | null;
  principalAmount: number | null;
};

export type ShareholderRow = {
  id: string;
  name: string;
  type: ShareholderType;
  email: string | null;
  isResident: boolean;
};

export type MovementRow = {
  id: string;
  kind: MovementKind;
  date: string;
  className: string;
  toClassName: string | null;
  fromHolderName: string | null;
  toHolderName: string | null;
  quantity: number;
  toQuantity: number | null;
  pricePerShare: number | null;
  note: string | null;
};

export type SnapshotRow = {
  holderId: string;
  name: string;
  type: ShareholderType;
  units: Record<string, number>;
  amounts: Record<string, number>;
  equityShares: number;
  fullyDilutedShares: number;
  issuedPct: number;
  fullyDilutedPct: number;
};

export type Snapshot = {
  asOf: string | null;
  classes: (SecurityClassRow & { totalUnits: number; amountBased: boolean })[];
  rows: SnapshotRow[];
  totals: { equityShares: number; fullyDilutedShares: number };
  esop: {
    poolSize: number;
    outstandingOptions: number;
    unallocated: number;
    fullyDilutedShares: number;
    fullyDilutedPct: number;
  };
  notes: string[];
};

export type CapTableResponse = {
  success: boolean;
  message?: string;
  classes: SecurityClassRow[];
  holders: ShareholderRow[];
  movements: MovementRow[];
  snapshot: Snapshot;
};

export const KIND_LABEL: Record<SecurityKind, string> = {
  EQUITY: "Equity shares",
  CCPS: "CCPS (preference)",
  CCD: "CCD (debentures)",
  CONVERTIBLE_NOTE: "Convertible note",
  ISAFE: "iSAFE",
  WARRANT: "Warrants",
};

export const HOLDER_TYPE_LABEL: Record<ShareholderType, string> = {
  FOUNDER: "Founder",
  INVESTOR: "Investor",
  EMPLOYEE: "Employee",
  OTHER: "Other",
};

export const MOVEMENT_LABEL: Record<MovementKind, string> = {
  ALLOTMENT: "Allotment (new shares)",
  TRANSFER: "Transfer between holders",
  CONVERSION: "Conversion",
  BUYBACK: "Buyback by company",
};

/* ------------------------------------------------------------------ */
/* ESOP pool and grants (step 4)                                       */
/* ------------------------------------------------------------------ */

export type SchemeRow = {
  id: string;
  name: string;
  poolSize: number;
  boardApprovedOn: string | null;
  shareholderApprovedOn: string | null;
  resolutionVote: "ORDINARY" | "SPECIAL" | null;
  mgt14FiledOn: string | null;
  explanatoryStatement: boolean;
  defaultVestingMonths: number;
  defaultCliffMonths: number;
  defaultPostExitDays: number;
  grantCount: number;
  optionsIssued: number;
  optionsInDraft: number;
  optionsAvailable: number;
};

export type GrantStatus = "DRAFT" | "ISSUED" | "ACCEPTED" | "LEFT" | "LAPSED" | "EXERCISED";

export type GrantPosition = {
  vested: number;
  unvested: number;
  vestedUnexercised: number;
  outstanding: number;
  lapsed: number;
  exercised: number;
  exerciseWindowEnds: string | null;
  exerciseCostOfVested: number;
};

export type GrantRow = {
  id: string;
  schemeId: string;
  scheme: { id: string; name: string };
  employeeName: string;
  employeeEmail: string | null;
  employeeRef: string | null;
  isPromoterOver10Pct: boolean;
  usOptionType?: "ISO" | "NSO" | null;
  grantDate: string;
  options: number;
  exercisePrice: number;
  vestingStart: string;
  vestingMonths: number;
  cliffMonths: number;
  expiryDate: string | null;
  postExitDays: number;
  status: GrantStatus;
  issuedAt: string | null;
  acceptedAt: string | null;
  leftOn: string | null;
  note: string | null;
  letterFileName: string | null;
  letterFileSize: number | null;
  letterUploadedAt: string | null;
  letterDownloadedAt: string | null;
  letterDownloadCount: number;
  position: GrantPosition;
};

export type GrantWarning = {
  code: string;
  severity: "BLOCK" | "WARN" | "INFO";
  message: string;
  source: string;
};

export type GrantDetailResponse = {
  success: boolean;
  message?: string;
  grant: Omit<GrantRow, "position" | "scheme"> & { scheme: SchemeRow };
  position: GrantPosition;
  milestones: { date: string; vestedTotal: number; vestedPct: number }[];
  warnings: GrantWarning[];
};

export const GRANT_STATUS_LABEL: Record<GrantStatus, string> = {
  DRAFT: "Draft",
  ISSUED: "Issued",
  ACCEPTED: "Accepted",
  LEFT: "Left company",
  LAPSED: "Lapsed",
  EXERCISED: "Exercised",
};

export const GRANT_STATUS_STYLE: Record<GrantStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  ISSUED: "bg-blue-50 text-blue-700",
  ACCEPTED: "bg-emerald-50 text-emerald-700",
  LEFT: "bg-amber-50 text-amber-700",
  LAPSED: "bg-slate-100 text-slate-400",
  EXERCISED: "bg-violet-50 text-violet-700",
};
