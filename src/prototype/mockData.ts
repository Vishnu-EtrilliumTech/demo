/**
 * PROTOTYPE MOCK DATA
 * -------------------
 * Static seed datasets used by the prototype's mock API layer. No backend is
 * involved anywhere in this build — every screen renders from the data below.
 *
 * IDs are stable so cross-references (a case's assignedToId → a user, a
 * hearing's caseId → a case, etc.) line up and the UI looks coherent.
 */

import type { PagedResponse } from '@/types/pagination';

// ── Date helpers (deterministic-ish, computed once at module load) ────────────
const now = Date.now();
const DAY = 86_400_000;
const iso = (offsetDays: number): string => new Date(now + offsetDays * DAY).toISOString();

// ── Identity / current user ───────────────────────────────────────────────────
export const DEMO_EMAIL = 'demo@lawsome.in';
export const DEMO_NAME = 'Ananya Sharma';
export const ORG_ID = '1';

// ── Organization ───────────────────────────────────────────────────────────────
export const organization = {
  id: ORG_ID,
  name: 'Sharma & Associates',
  description: 'Full-service litigation and corporate law firm based in Bengaluru.',
  segments: ['Litigation', 'Corporate', 'Real Estate'],
  phoneNumber: 9845012345,
  emailId: 'contact@sharma-associates.in',
  organizationKey: 'sharma-associates',
  createdDate: iso(-540),
  updatedDate: iso(-3),
  enabled: true,
  currentUser: {
    id: '201',
    fullName: DEMO_NAME,
    emailId: DEMO_EMAIL,
    enabled: true,
    roles: ['OrganizationAdmin'],
    registeredDate: iso(-540),
    lastLoginDate: iso(0),
    phoneNumber: 9845012345,
  },
};

// ── Sites ────────────────────────────────────────────────────────────────────
export const sites = [
  {
    id: '101', name: 'Bengaluru HQ', description: 'Head office and main litigation team.',
    phoneNumber: 8040112233, emailId: 'blr@sharma-associates.in',
    address: '12, MG Road', pincode: '560001', district: 'Bengaluru Urban', state: 'Karnataka',
    landmark: 'Near Trinity Metro', locality: 'MG Road', longitude: 77.6194, latitude: 12.9756,
    siteKey: 'blr-hq', createdDate: iso(-540), updatedDate: iso(-10), enabled: true,
    organizationId: ORG_ID, casesCount: 8, usersCount: 6,
  },
  {
    id: '102', name: 'Chennai Branch', description: 'South regional office.',
    phoneNumber: 4428112233, emailId: 'chennai@sharma-associates.in',
    address: '45, Anna Salai', pincode: '600002', district: 'Chennai', state: 'Tamil Nadu',
    landmark: 'Opp. LIC Building', locality: 'Anna Salai', longitude: 80.2707, latitude: 13.0604,
    siteKey: 'chennai', createdDate: iso(-300), updatedDate: iso(-20), enabled: true,
    organizationId: ORG_ID, casesCount: 4, usersCount: 3,
  },
];

// ── Users ────────────────────────────────────────────────────────────────────
const roleSets = [
  ['OrganizationAdmin'], ['SiteAdmin'], ['SiteClerk'], ['Advocate'], ['Advocate'], ['SiteClerk'],
];
export const users = [
  { id: '201', fullName: DEMO_NAME, emailId: DEMO_EMAIL, phoneNumber: 9845012345, gender: 'Female' },
  { id: '202', fullName: 'Rahul Verma', emailId: 'rahul.verma@sharma-associates.in', phoneNumber: 9845022345, gender: 'Male' },
  { id: '203', fullName: 'Priya Nair', emailId: 'priya.nair@sharma-associates.in', phoneNumber: 9845032345, gender: 'Female' },
  { id: '204', fullName: 'Arjun Mehta', emailId: 'arjun.mehta@sharma-associates.in', phoneNumber: 9845042345, gender: 'Male' },
  { id: '205', fullName: 'Sneha Reddy', emailId: 'sneha.reddy@sharma-associates.in', phoneNumber: 9845052345, gender: 'Female' },
  { id: '206', fullName: 'Vikram Singh', emailId: 'vikram.singh@sharma-associates.in', phoneNumber: 9845062345, gender: 'Male' },
].map((u, i) => ({
  ...u,
  userId: u.id,
  roles: roleSets[i] ?? ['Advocate'],
  organizationId: ORG_ID,
  registeredDate: iso(-400 + i * 20),
  lastLoginDate: iso(-i),
  enabled: true,
  siteId: i < 4 ? '101' : '102',
  siteName: i < 4 ? 'Bengaluru HQ' : 'Chennai Branch',
}));

// ── Cases ────────────────────────────────────────────────────────────────────
const caseTitles = [
  'Sharma vs. State of Karnataka', 'Acme Corp Contract Dispute', 'Estate of R. Iyer',
  'Kumar Property Partition', 'Zenith Ltd. Trademark Suit', 'Fernandes Tenancy Matter',
  'GreenTech Environmental PIL', 'Rao Family Maintenance', 'Delta Motors Insurance Claim',
  'Nair vs. Nair Divorce', 'Skyline Builders Arbitration', 'Public Bank Loan Recovery',
];
const statuses = ['Open', 'InProgress', 'OnHold', 'Closed'];
export const cases = caseTitles.map((title, i) => ({
  id: String(1001 + i),
  title,
  description: `Matter concerning ${title}. Prototype record for demonstration purposes.`,
  status: statuses[i % statuses.length],
  createdAt: iso(-200 + i * 10),
  createdDate: iso(-200 + i * 10),
  modifiedDate: iso(-i * 2),
  updatedAt: iso(-i * 2),
  assignedToId: users[(i % users.length)].id,
  caseNumber: `CS/${2024 + (i % 2)}/${1200 + i}`,
  cnrNumber: `KABL0${String(100000 + i * 137).slice(0, 6)}${2024}`,
  caseKey: `case-${1001 + i}`,
  createdById: '201',
  siteId: i % 3 === 2 ? '102' : '101',
  siteName: i % 3 === 2 ? 'Chennai Branch' : 'Bengaluru HQ',
  accessLevel: 'Full',
  hasCnrNumber: i % 4 !== 3,
}));

// ── Hearings ───────────────────────────────────────────────────────────────────
export const hearings = cases.slice(0, 8).map((c, i) => ({
  id: String(3001 + i),
  hearingDateTime: iso(2 + i * 3),
  hearingNotes: 'Arguments to be presented. Bring certified copies.',
  hearingLocation: i % 2 === 0 ? 'Court Hall 4, City Civil Court' : 'Court Hall 12, High Court',
  googleMapLocation: 'City Civil Court, Bengaluru',
  courtLocationId: String(9001 + (i % 3)),
  courtLocationDisplay: i % 2 === 0 ? 'City Civil Court, Bengaluru' : 'High Court of Karnataka',
  caseId: c.id,
  caseName: c.caseNumber,
  assignedToId: c.assignedToId,
  assignedToName: users.find((u) => u.id === c.assignedToId)?.fullName ?? DEMO_NAME,
  createdById: '201',
  siteId: c.siteId,
  siteName: c.siteName,
  status: i % 3 === 0 ? 'Scheduled' : 'Upcoming',
  hearingStatus: i % 3 === 0 ? 'Scheduled' : 'Upcoming',
  createdDate: iso(-10 + i),
}));

// ── Tasks ──────────────────────────────────────────────────────────────────────
export const tasks = cases.slice(0, 10).map((c, i) => ({
  id: String(4001 + i),
  title: ['Draft affidavit', 'File vakalatnama', 'Prepare written statement', 'Client meeting', 'Collect evidence'][i % 5],
  description: 'Prototype task item.',
  status: ['Pending', 'InProgress', 'Completed'][i % 3],
  dueDate: iso(3 + i),
  assignedToId: Number(c.assignedToId),
  createdById: 201,
  caseId: c.id,
  siteId: Number(c.siteId),
  createdDate: iso(-15 + i),
  modifiedDate: iso(-i),
  closedDate: '',
}));

// ── Documents ────────────────────────────────────────────────────────────────
export const documents = cases.slice(0, 8).map((c, i) => ({
  id: String(5001 + i),
  fileName: ['petition.pdf', 'evidence-bundle.pdf', 'order-copy.pdf', 'agreement.pdf'][i % 4],
  documentName: ['Petition', 'Evidence Bundle', 'Order Copy', 'Agreement'][i % 4],
  fileType: 'application/pdf',
  fileSize: 128000 + i * 4096,
  caseId: c.id,
  uploadedById: '201',
  uploadedByName: DEMO_NAME,
  createdDate: iso(-20 + i),
  remarks: 'Uploaded for reference.',
}));

// ── Comments ─────────────────────────────────────────────────────────────────
export const comments = cases.slice(0, 6).map((c, i) => ({
  id: String(6001 + i),
  content: ['Please review the latest draft.', 'Client confirmed the hearing date.', 'Opposing counsel requested adjournment.'][i % 3],
  caseId: c.id,
  createdById: users[i % users.length].id,
  createdByName: users[i % users.length].fullName,
  createdDate: iso(-5 + i),
  replies: [],
}));

// ── Invoices ─────────────────────────────────────────────────────────────────
const paymentStatuses = ['Paid', 'Pending', 'Failed', 'None'];
export const invoices = cases.slice(0, 6).map((c, i) => ({
  id: String(7001 + i),
  generatedDate: iso(-30 + i * 3),
  dueDate: iso(5 + i * 3),
  paymentStatus: paymentStatuses[i % paymentStatuses.length],
  paymentReceivedDate: i % paymentStatuses.length === 0 ? iso(-10 + i) : undefined,
  amount: 25000 + i * 7500,
  caseId: c.id,
  invoiceFileName: `invoice-${7001 + i}.pdf`,
  invoiceContent: '',
  remarks: 'Professional fees and court expenses.',
  createdById: '201',
}));

// ── Case clients ────────────────────────────────────────────────────────────
export const caseClients = cases.slice(0, 8).map((c, i) => ({
  id: String(8001 + i),
  fullName: ['Mohan Das', 'Latha Krishnan', 'Imran Khan', 'Rosy Fernandes'][i % 4],
  emailId: ['mohan@example.com', 'latha@example.com', 'imran@example.com', 'rosy@example.com'][i % 4],
  phoneNumber: 9800000000 + i,
  caseId: c.id,
  invitationStatus: i % 2 === 0 ? 'Accepted' : 'Pending',
  createdDate: iso(-40 + i),
}));

// ── Contributors (CaseContributor shape: feature 033/034) ─────────────────────
export const contributors = users.slice(1, 4).map((u, i) => ({
  id: String(8501 + i),
  caseId: '1001',
  siteId: '101',
  organizationId: ORG_ID,
  userId: u.id,
  userFullName: u.fullName,
  userEmail: u.emailId,
  accessLevel: i % 2 === 0 ? 1 : 0, // 1 = Edit, 0 = ViewOnly
  addedById: '201',
  addedByFullName: DEMO_NAME,
  createdDate: iso(-30 + i),
}));

// ── Reference cases ───────────────────────────────────────────────────────────
export const referenceCases = [
  { cnrNumber: 'KABL010023452023', caseTitle: 'Precedent A vs. B', courtName: 'High Court of Karnataka', addedDate: iso(-25) },
  { cnrNumber: 'KABL010078902022', caseTitle: 'Landmark C vs. D', courtName: 'Supreme Court of India', addedDate: iso(-18) },
];

// ── eCourts: states / districts / court locations ─────────────────────────────
export const courtStates = [
  { code: 'KA', name: 'Karnataka' }, { code: 'TN', name: 'Tamil Nadu' },
  { code: 'MH', name: 'Maharashtra' }, { code: 'DL', name: 'Delhi' },
];
export const courtDistricts: Record<string, { code: string; name: string }[]> = {
  KA: [{ code: 'BLR', name: 'Bengaluru' }, { code: 'MYS', name: 'Mysuru' }],
  TN: [{ code: 'CHN', name: 'Chennai' }, { code: 'CBE', name: 'Coimbatore' }],
  MH: [{ code: 'MUM', name: 'Mumbai' }, { code: 'PUN', name: 'Pune' }],
  DL: [{ code: 'NDL', name: 'New Delhi' }],
};
// Keyed by districtCode — the Jurisdiction cascade's third level (District → Court Complex).
export const courtComplexes: Record<string, { code: string; name: string }[]> = {
  BLR: [{ code: 'BLR-CCC', name: 'City Civil Court Complex' }, { code: 'BLR-HC', name: 'High Court Complex' }],
  MYS: [{ code: 'MYS-DC', name: 'District Court Complex' }],
  CHN: [{ code: 'CHN-HC', name: 'Madras High Court Complex' }, { code: 'CHN-DC', name: 'City Civil Court Complex' }],
  CBE: [{ code: 'CBE-DC', name: 'District Court Complex' }],
  MUM: [{ code: 'MUM-HC', name: 'Bombay High Court Complex' }, { code: 'MUM-CC', name: 'City Civil Court Complex' }],
  PUN: [{ code: 'PUN-DC', name: 'District Court Complex' }],
  NDL: [{ code: 'NDL-HC', name: 'Delhi High Court Complex' }, { code: 'NDL-DC', name: 'District Court Complex, Tis Hazari' }],
};
// Keyed by complexCode — the Jurisdiction cascade's fourth level (Court Complex → Court).
export const courts: Record<string, { code: string; name: string }[]> = {
  'BLR-CCC': [{ code: 'BLR-CCC-1', name: 'Court Hall 1 — Civil Judge (Sr. Dn.)' }, { code: 'BLR-CCC-4', name: 'Court Hall 4 — Civil Judge (Jr. Dn.)' }],
  'BLR-HC': [{ code: 'BLR-HC-1', name: 'Court Hall 1 — Justice Bench' }],
  'MYS-DC': [{ code: 'MYS-DC-1', name: 'Court Hall 1 — District Judge' }],
  'CHN-HC': [{ code: 'CHN-HC-1', name: 'Court Hall 1 — Justice Bench' }],
  'CHN-DC': [{ code: 'CHN-DC-1', name: 'Court Hall 1 — Civil Judge' }],
  'CBE-DC': [{ code: 'CBE-DC-1', name: 'Court Hall 1 — District Judge' }],
  'MUM-HC': [{ code: 'MUM-HC-1', name: 'Court Hall 1 — Justice Bench' }],
  'MUM-CC': [{ code: 'MUM-CC-1', name: 'Court Hall 1 — Civil Judge' }],
  'PUN-DC': [{ code: 'PUN-DC-1', name: 'Court Hall 1 — District Judge' }],
  'NDL-HC': [{ code: 'NDL-HC-1', name: 'Court Hall 1 — Justice Bench' }],
  'NDL-DC': [{ code: 'NDL-DC-1', name: 'Court Hall 1 — Civil Judge' }],
};
export const courtLocations = [
  { id: '9001', courtName: 'City Civil Court', courtComplexName: 'City Civil Court Complex', districtName: 'Bengaluru', stateName: 'Karnataka', isHighCourtOrSupreme: false, display: 'City Civil Court, Bengaluru, Karnataka' },
  { id: '9002', courtName: 'High Court of Karnataka', courtComplexName: 'High Court Complex', districtName: 'Bengaluru', stateName: 'Karnataka', isHighCourtOrSupreme: true, display: 'High Court of Karnataka, Bengaluru' },
  { id: '9003', courtName: 'Madras High Court', courtComplexName: 'HC Complex', districtName: 'Chennai', stateName: 'Tamil Nadu', isHighCourtOrSupreme: true, display: 'Madras High Court, Chennai' },
];

// ── eCourts search results ────────────────────────────────────────────────────
export const ecourtSearchResults = Array.from({ length: 6 }).map((_, i) => ({
  cnr: `KABL0${String(200000 + i * 313).slice(0, 6)}2024`,
  caseType: ['Civil', 'Criminal', 'Writ Petition'][i % 3],
  caseStatus: i % 2 === 0 ? 'pending' : 'disposed',
  filingDate: iso(-300 + i * 10),
  nextHearingDate: i % 2 === 0 ? iso(5 + i) : null,
  registrationNumber: `REG/${1000 + i}/2024`,
  registrationDate: iso(-295 + i * 10),
  decisionDate: i % 2 === 0 ? null : iso(-30 + i),
  judges: ['Hon. Justice S. Kumar'],
  petitioners: [['Ravi Shankar', 'Meena Devi', 'GreenTech Pvt Ltd'][i % 3]],
  respondents: [['State of Karnataka', 'Acme Corp', 'Municipal Corp'][i % 3]],
  petitionerAdvocates: ['Adv. R. Verma'],
  courtCode: 'BLR-1',
  judicialSection: 'Civil',
  stateCode: 'KA',
  districtCode: 1,
  caseCategory: 'Civil',
}));

// ── eCourts search: dynamic, reflects the Jurisdiction cascade + typed value ──
const PARTY_POOL = ['Ravi Shankar', 'Meena Devi', 'GreenTech Pvt Ltd', 'Acme Corp', 'State of Karnataka', 'Municipal Corp'];
const ADVOCATE_POOL = ['Adv. R. Verma', 'Adv. P. Nair', 'Adv. S. Iyer'];
const CASE_TYPES = ['Civil', 'Criminal', 'Writ Petition'];

/** Builds demo search results seeded off the selected Jurisdiction + search tab, so
 *  the CNR/party/advocate the user typed shows up in the results instead of a
 *  fixed canned list regardless of what was searched. */
export function buildEcourtSearchResults(q: Record<string, string> = {}) {
  const courtCode = q.courtCode || 'BLR-CCC-4';
  const stateCode = q.stateCode || 'KA';
  const districtCode = q.districtCode || 'BLR';
  const searchType = q.searchType || 'query';
  const searchValue = q.searchValue?.trim();
  return Array.from({ length: 4 }).map((_, i) => {
    const petitioner = searchType === 'party' && searchValue ? searchValue : PARTY_POOL[i % PARTY_POOL.length];
    const respondent = PARTY_POOL[(i + 3) % PARTY_POOL.length];
    const advocate = searchType === 'advocates' && searchValue ? searchValue : ADVOCATE_POOL[i % ADVOCATE_POOL.length];
    const registrationNumber = ['filingNumber', 'query', 'fir'].includes(searchType) && searchValue
      ? searchValue
      : `REG/${1000 + i}/2024`;
    return {
      cnr: `${stateCode}${districtCode}0${String(300000 + i * 271).slice(0, 6)}2024`,
      caseType: CASE_TYPES[i % CASE_TYPES.length],
      caseStatus: q.caseStatus === 'disposed' ? 'disposed' : q.caseStatus === 'pending' ? 'pending' : i % 2 === 0 ? 'pending' : 'disposed',
      filingDate: iso(-300 + i * 12),
      nextHearingDate: i % 2 === 0 ? iso(4 + i) : null,
      registrationNumber,
      registrationDate: iso(-295 + i * 12),
      decisionDate: i % 2 === 0 ? null : iso(-20 + i),
      judges: ['Hon. Justice S. Kumar'],
      petitioners: [petitioner],
      respondents: [respondent],
      petitionerAdvocates: [advocate],
      courtCode,
      judicialSection: 'Civil',
      stateCode,
      districtCode: 1,
      caseCategory: 'Civil',
    };
  });
}

// ── eCourts quota ──────────────────────────────────────────────────────────────
export const ecourtsQuota = {
  organizationId: Number(ORG_ID),
  monthlyLimit: 500,
  consumedCount: 137,
  remainingCount: 363,
  periodStart: iso(-15),
  isExhausted: false,
  isWarning: false,
  isUnlimited: false,
};

// ── Persisted eCourt cases / unlinked / search history ────────────────────────
export const persistedEcourtCases = ecourtSearchResults.slice(0, 4).map((r, i) => ({
  cnrNumber: r.cnr,
  caseTitle: `${r.petitioners[0]} vs. ${r.respondents[0]}`,
  courtName: 'City Civil Court, Bengaluru',
  caseStatus: r.caseStatus,
  linkedCaseDetails: i < 2 ? [{ id: cases[i].id, title: cases[i].title, caseNumber: cases[i].caseNumber, cnrNumber: r.cnr, siteId: cases[i].siteId, status: cases[i].status, createdDate: cases[i].createdDate }] : [],
  referenceCaseCount: i,
  referencedCases: [],
  remarks: i === 0 ? 'Monitor for next hearing.' : null,
  lastRefreshed: iso(-i),
  canDelete: true,
}));

export const unlinkedCases = cases.filter((c) => !c.hasCnrNumber).map((c) => ({
  id: c.id, title: c.title, caseNumber: c.caseNumber, cnrNumber: null,
  description: c.description ?? '', siteId: c.siteId, status: c.status,
  createdDate: c.createdDate, modifiedDate: c.modifiedDate,
}));

export const searchHistory = ecourtSearchResults.slice(0, 5).map((r, i) => ({
  id: String(9501 + i),
  cnrNumber: r.cnr,
  searchedByName: DEMO_NAME,
  searchType: 'query',
  searchedAt: iso(-i),
  caseTitle: `${r.petitioners[0]} vs. ${r.respondents[0]}`,
  courtName: 'City Civil Court, Bengaluru',
}));

// ── Court data (CNR viewer) ────────────────────────────────────────────────────
export function buildCourtData(cnr: string) {
  return {
    courtCaseData: {
      caseNumber: 'OS/1234/2024', district: 'Bengaluru', state: 'Karnataka', stateCode: 'KA',
      districtCode: 'BLR', courtCode: 1, courtName: 'City Civil Court', courtNo: 4,
      firDetails: {}, caseType: 'Original Suit', caseTypeRaw: 'OS', caseStatus: 'Pending',
      filingNumber: 'F/5678/2024', filingDate: iso(-300), registrationNumber: 'R/1234/2024',
      registrationDate: iso(-295), firstHearingDate: iso(-250), nextHearingDate: iso(7),
      lastHearingDate: iso(-14), decisionDate: null, caseDurationDays: 300, filingToFirstHearingDays: 50,
      cnr, cnrCourtCode: 'KABL01', courtComplexCode: 'CCC', cnrCaseNumber: '001234', cnrYear: '2024',
      purpose: 'Arguments', disposalType: '', disposalTypeRaw: '', contestedStatus: 'Contested',
      judicialSection: 'Civil', judicialSectionRaw: 'CIVIL',
      judges: ['Hon. Justice S. Kumar'],
      petitioners: ['Ravi Shankar', 'Meena Devi'], petitionerAdvocates: ['Adv. R. Verma'],
      respondents: ['State of Karnataka'], respondentAdvocates: ['Adv. P. Nair'],
      hasOrders: true, hasJudgments: false, orderCount: 3, interimOrderCount: 1, judgmentCount: 0,
      hearingCount: 8, iaCount: 2,
      historyOfCaseHearings: [
        { judge: 'Hon. Justice S. Kumar', businessOnDate: 'Arguments heard', hearingDate: iso(-14), purposeOfListing: 'Arguments' },
        { judge: 'Hon. Justice S. Kumar', businessOnDate: 'Adjourned', hearingDate: iso(-45), purposeOfListing: 'Evidence' },
      ],
      filedDocuments: [
        { srNo: '1', documentNo: 'D-1', dateOfReceiving: iso(-290), filedBy: 'Petitioner', documentFiled: 'Plaint', advocateName: 'Adv. R. Verma' },
      ],
      subordinateCourt: {}, linkCases: [],
      interimOrders: [{ orderDate: iso(-60), description: 'Interim stay granted', orderUrl: 'order-1.pdf' }],
      processes: [],
      interlocutoryApplications: [{ regNo: 'IA/12/2024', remark: 'Application for stay', filedBy: 'Petitioner', filingDate: iso(-70), status: 'Disposed' }],
      judgmentOrders: [],
      taggedMatters: [], earlierCourtDetails: [], notices: [], caveatDetails: [], listingDates: [],
    },
    entityInfo: { cnr, nextDateOfHearing: iso(7), lastDateOfHearing: iso(-14), dateCreated: iso(-300), dateModified: iso(-1) },
    files: [],
    descriptions: {
      enumFields: [],
      enumLookup: { caseType: {}, caseStatus: {}, courtCode: {}, judicialSection: {}, caseCategory: {}, benchType: {}, stateCode: {} },
    },
    caseAiAnalysis: null,
  };
}

// ── Admin dashboard datasets ───────────────────────────────────────────────────
export const legalExperts = Array.from({ length: 8 }).map((_, i) => ({
  id: String(11001 + i),
  name: ['Adv. Rajesh Gupta', 'Adv. Sunita Rao', 'CA Manoj Pillai', 'Adv. Farah Ali', 'Adv. Deepak Menon', 'CA Anita Joshi', 'Adv. Karan Malhotra', 'Adv. Leela Krishnan'][i],
  phone: `98${String(45000000 + i * 111111)}`,
  email: `expert${i + 1}@lawsome.in`,
  location: ['Bengaluru', 'Chennai', 'Mumbai', 'Delhi'][i % 4],
  expertType: i % 3 === 2 ? 'Chartered Accountant' : 'Advocate',
  clientCount: 5 + i * 3,
  upcomingAppointments: i % 5,
  pastAppointments: 10 + i * 2,
  fees: 1500 + i * 250,
  approvalStatus: i % 4 === 0 ? 'Pending' : 'Approved',
}));

export const clients = Array.from({ length: 8 }).map((_, i) => ({
  id: String(12001 + i),
  name: ['Mohan Das', 'Latha Krishnan', 'Imran Khan', 'Rosy Fernandes', 'Suresh Babu', 'Divya Menon', 'Aakash Jain', 'Nisha Rao'][i],
  phone: `98${String(76000000 + i * 121212)}`,
  email: `client${i + 1}@example.com`,
  gender: i % 2 === 0 ? 'Male' : 'Female',
  status: i % 3 === 0 ? 'Inactive' : 'Active',
}));

export const appointments = Array.from({ length: 8 }).map((_, i) => ({
  id: String(13001 + i),
  legalExpertName: legalExperts[i % legalExperts.length].name,
  clientName: clients[i % clients.length].name,
  location: ['Bengaluru', 'Chennai', 'Online'][i % 3],
  mode: i % 3 === 2 ? 'Video' : 'In-person',
  appointmentDate: iso(i - 3),
  appointmentTime: ['10:00 AM', '11:30 AM', '02:00 PM', '04:30 PM'][i % 4],
}));

export const payments = Array.from({ length: 8 }).map((_, i) => ({
  id: String(14001 + i),
  date: iso(-i * 5),
  clientName: clients[i % clients.length].name,
  transactionReference: `TXN${100000 + i * 777}`,
  amount: 2000 + i * 500,
  status: ['Paid', 'Pending', 'Refunded'][i % 3],
}));

export const ratings = Array.from({ length: 6 }).map((_, i) => ({
  id: String(15001 + i),
  clientName: clients[i % clients.length].name,
  ratingValue: 5 - (i % 3),
  comment: ['Very helpful and professional.', 'Good guidance throughout.', 'Prompt responses.'][i % 3],
  createdDate: iso(-i * 7),
}));

export const legalExpertCases = cases.slice(0, 5).map((c) => ({
  id: c.id, title: c.title, caseNumber: c.caseNumber, status: c.status, createdDate: c.createdDate,
}));

export const legalExpertCommunications = Array.from({ length: 4 }).map((_, i) => ({
  id: String(16001 + i),
  type: ['Email', 'Call', 'Message'][i % 3],
  subject: ['Case update', 'Appointment reminder', 'Document request'][i % 3],
  createdDate: iso(-i * 3),
}));

// ── Legal expert (self) profile for client/legalexpert flows ───────────────────
export const legalExpertProfile = {
  id: '11001',
  fullName: 'Adv. Rajesh Gupta',
  emailId: DEMO_EMAIL,
  phoneNumber: 9845099999,
  expertType: 'Advocate',
  approvalStatus: 'Approved',
  registrationStage: 'Schedule',
};

export const clientProfile = {
  id: '12001',
  fullName: DEMO_NAME,
  emailId: DEMO_EMAIL,
  phoneNumber: 9845012345,
  gender: 'Female',
};

// ── Search / public profiles (marketing search page) ──────────────────────────
export const searchProfiles = legalExperts.map((e, i) => ({
  id: e.id,
  fullName: e.name,
  expertType: e.expertType,
  location: e.location,
  rating: 4 + (i % 2) * 0.5,
  reviewCount: 10 + i * 4,
  fees: e.fees,
  experienceYears: 3 + i,
  languages: ['English', 'Hindi', 'Kannada'].slice(0, 1 + (i % 3)),
  practiceAreas: ['Civil', 'Criminal', 'Corporate', 'Family'].slice(0, 1 + (i % 3)),
  imageUrl: '',
  verified: i % 3 !== 0,
}));

// ── Legal-expert types (search page dropdown) ─────────────────────────────────
export const expertTypes = [
  { id: '1', expertType: 'Advocate' },
  { id: '2', expertType: 'Chartered Accountant' },
  { id: '3', expertType: 'Company Secretary' },
  { id: '4', expertType: 'Notary' },
  { id: '5', expertType: 'Legal Consultant' },
];

// ── Public legal-expert search results (search/basic) ─────────────────────────
export const legalExpertSearchResults = searchProfiles.map((p) => ({
  id: p.id,
  fullName: p.fullName,
  expertType: p.expertType,
  location: p.location,
  rating: p.rating,
  reviewCount: p.reviewCount,
  fees: p.fees,
  experienceYears: p.experienceYears,
  languages: p.languages,
  practiceAreas: p.practiceAreas,
  imageUrl: p.imageUrl,
  verified: p.verified,
  distanceInMeters: 1500 + Number(p.id) * 10,
}));

// ── Pagination helper (respects page/pageSize query) ───────────────────────────
export function page<T>(items: T[], q: Record<string, string> = {}): PagedResponse<T> {
  const pageNum = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
  const pageSize = Math.max(1, parseInt(q.pageSize ?? '20', 10) || 20);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = (pageNum - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount, page: pageNum, pageSize, totalPages,
    hasNextPage: pageNum < totalPages, hasPreviousPage: pageNum > 1,
  };
}
