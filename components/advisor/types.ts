export type CompanyType = "PRIVATE_LIMITED" | "UNLISTED_PUBLIC";

export type ResolutionRow = {
  id: string;
  kind: "BOARD_SCHEME_APPROVAL" | "SHAREHOLDER_SCHEME_APPROVAL";
  vote: "ORDINARY" | "SPECIAL";
  passedOn: string;
  mgt14Filed: string | null;
  explanatoryStatementOnFile: boolean;
};

export type ValuationRow = {
  id: string;
  valuationDate: string;
  fmvPerShare: number;
  valuerName: string | null;
  signedBySebiCat1MerchantBanker: boolean;
  reference: string | null;
};

export type ClientDetail = {
  id: string;
  name: string;
  cin: string | null;
  companyType: CompanyType;
  incorporationDate: string | null;
  approvedPoolSize: number | null;
  dpiitRecognised: boolean | null;
  imbCertificate: boolean | null;
  overseasParent: boolean | null;
  updatedAt: string;
  resolutions: ResolutionRow[];
  valuations: ValuationRow[];
  _count: { grants: number; exercises: number; capTable: number };
};