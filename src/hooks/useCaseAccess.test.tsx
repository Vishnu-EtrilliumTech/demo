import { describe, it, expect } from 'vitest';
import { computeCaseAccess } from './useCaseAccess';
import {
  CaseAccessLevel,
  CaseContributor,
  ContributorAccessLevel,
  canDeleteCaseEntity,
  canEditCaseEntity,
  parseCaseApiAccessLevel,
} from '@/app/organization/types/caseindex';

const CREATOR_ID = '00000000-0000-0000-0000-000000000100';
const ASSIGNEE_ID = '00000000-0000-0000-0000-000000000200';
const OTHER_ID = '00000000-0000-0000-0000-000000000999';

// CaseContributor.userId is still `number` pending its own GUID retype
// (tasks.md T038); useCaseAccess bridges the comparison via String(c.userId).
// Keep this fixture's string form matching the numeric backend id it stands
// in for until that retype lands.
const CONTRIB_NUMERIC_ID = 300;
const CONTRIB_ID = String(CONTRIB_NUMERIC_ID);

function makeContributor(
  userId: number,
  accessLevel: ContributorAccessLevel
): CaseContributor {
  return {
    id: 1,
    caseId: 10,
    userId,
    userFullName: 'Test User',
    userEmail: 'test@example.com',
    accessLevel,
    addedById: 1,
    addedByFullName: 'Adder',
    createdDate: '2026-06-16T00:00:00+00:00',
  };
}

const base = {
  roles: [] as string[],
  currentUserId: OTHER_ID,
  createdById: CREATOR_ID,
  assignedToId: ASSIGNEE_ID,
  contributors: [] as CaseContributor[],
};

describe('computeCaseAccess', () => {
  // Row 1
  it('SystemAdmin → Full/Full, canManage true', () => {
    const r = computeCaseAccess({ ...base, roles: ['SystemAdmin'] });
    expect(r.entityLevel).toBe(CaseAccessLevel.Full);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(true);
  });

  // Row 2
  it('OrganizationAdmin → Full/Full, canManage true', () => {
    const r = computeCaseAccess({ ...base, roles: ['OrganizationAdmin'] });
    expect(r.entityLevel).toBe(CaseAccessLevel.Full);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(true);
  });

  // Row 3
  it('SiteAdmin → Full/Full, canManage true', () => {
    const r = computeCaseAccess({ ...base, roles: ['SiteAdmin'] });
    expect(r.entityLevel).toBe(CaseAccessLevel.Full);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(true);
  });

  // Row 4 — resource exceeds entity; canManage false
  it('SiteSrLegalExpert → Edit/Full, canManage false', () => {
    const r = computeCaseAccess({ ...base, roles: ['SiteSrLegalExpert'] });
    expect(r.entityLevel).toBe(CaseAccessLevel.Edit);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(false);
  });

  // Row 5
  it('OrganizationClerk → View/View, canManage false', () => {
    const r = computeCaseAccess({ ...base, roles: ['OrganizationClerk'] });
    expect(r.entityLevel).toBe(CaseAccessLevel.View);
    expect(r.resourceLevel).toBe(CaseAccessLevel.View);
    expect(r.canManageContributors).toBe(false);
  });

  // Row 6
  it('Creator (non-SiteClerk) → Edit/Full, canManage true', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteLegalExpert'],
      currentUserId: CREATOR_ID,
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.Edit);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(true);
  });

  // Row 6 nuance — SiteClerk creator falls through (no row 6)
  it('Creator who is SiteClerk does NOT get creator privileges (falls through)', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteClerk'],
      currentUserId: CREATOR_ID,
      assignedToId: ASSIGNEE_ID, // not the assignee
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.None);
    expect(r.resourceLevel).toBe(CaseAccessLevel.None);
    // SiteClerk is excluded from canManageContributors and not creator-privileged,
    // but they ARE the creator id → canManage uses isCreator OR-ed, so still true.
    expect(r.canManageContributors).toBe(true);
  });

  // Row 7
  it('Assignee → Edit/Full, canManage true', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteLegalExpert'],
      currentUserId: ASSIGNEE_ID,
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.Edit);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(true);
  });

  // Row 8 — Edit contributor caps resource at Edit (no delete); canManage false
  it('Edit contributor → Edit/Edit, canManage false', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteLegalExpert'],
      currentUserId: CONTRIB_ID,
      contributors: [makeContributor(CONTRIB_NUMERIC_ID, ContributorAccessLevel.Edit)],
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.Edit);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Edit);
    expect(r.contributorLevel).toBe(ContributorAccessLevel.Edit);
    expect(r.canManageContributors).toBe(false);
  });

  // Row 9
  it('ViewOnly contributor → View/View, canManage false', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteLegalExpert'],
      currentUserId: CONTRIB_ID,
      contributors: [makeContributor(CONTRIB_NUMERIC_ID, ContributorAccessLevel.ViewOnly)],
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.View);
    expect(r.resourceLevel).toBe(CaseAccessLevel.View);
    expect(r.contributorLevel).toBe(ContributorAccessLevel.ViewOnly);
    expect(r.canManageContributors).toBe(false);
  });

  // No match
  it('No match → None/None', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteLegalExpert'],
      currentUserId: OTHER_ID,
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.None);
    expect(r.resourceLevel).toBe(CaseAccessLevel.None);
    expect(r.canManageContributors).toBe(false);
  });

  // empty-string / null no-match (GUID equivalent of the old numeric-0 sentinel)
  it('currentUserId "" with createdById "" never matches creator/assignee', () => {
    const r = computeCaseAccess({
      roles: ['SiteLegalExpert'],
      currentUserId: '',
      createdById: '',
      assignedToId: null,
      contributors: [],
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.None);
    expect(r.canManageContributors).toBe(false);
  });

  // Positive proof: a genuine matching GUID string grants access — the
  // sentinel-denial test above doesn't prove the converse (a valid id
  // actually resolving to access), which is the case most likely to regress
  // silently (tsc can't catch two same-shaped-but-wrong strings).
  it('currentUserId matching createdById (GUID string) grants creator access', () => {
    const r = computeCaseAccess({
      roles: ['SiteLegalExpert'],
      currentUserId: CREATOR_ID,
      createdById: CREATOR_ID,
      assignedToId: null,
      contributors: [],
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.Edit);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
    expect(r.canManageContributors).toBe(true);
  });

  // Multiple matches → highest wins
  it('SiteAdmin who is also a ViewOnly contributor → Full/Full (highest wins)', () => {
    const r = computeCaseAccess({
      ...base,
      roles: ['SiteAdmin'],
      currentUserId: CONTRIB_ID,
      contributors: [makeContributor(CONTRIB_NUMERIC_ID, ContributorAccessLevel.ViewOnly)],
    });
    expect(r.entityLevel).toBe(CaseAccessLevel.Full);
    expect(r.resourceLevel).toBe(CaseAccessLevel.Full);
  });

  // resourceLevel can exceed entityLevel
  it('SrLegalExpert: canDeleteResource true while canDeleteCase false (resource > entity)', () => {
    const r = computeCaseAccess({ ...base, roles: ['SiteSrLegalExpert'] });
    const canDeleteResource = r.resourceLevel === CaseAccessLevel.Full;
    const canDeleteCase = r.entityLevel === CaseAccessLevel.Full;
    expect(canDeleteResource).toBe(true);
    expect(canDeleteCase).toBe(false);
  });
});

describe('parseCaseApiAccessLevel', () => {
  it('maps the string enum onto the numeric ladder', () => {
    expect(parseCaseApiAccessLevel('None')).toBe(CaseAccessLevel.None);
    expect(parseCaseApiAccessLevel('View')).toBe(CaseAccessLevel.View);
    expect(parseCaseApiAccessLevel('Edit')).toBe(CaseAccessLevel.Edit);
    expect(parseCaseApiAccessLevel('Full')).toBe(CaseAccessLevel.Full);
  });

  it('returns null for absent/unknown values (callers fall back to local compute)', () => {
    expect(parseCaseApiAccessLevel(undefined)).toBeNull();
    expect(parseCaseApiAccessLevel(null)).toBeNull();
    expect(parseCaseApiAccessLevel('')).toBeNull();
    expect(parseCaseApiAccessLevel('Editor')).toBeNull();
  });
});

describe('canEditCaseEntity / canDeleteCaseEntity', () => {
  it('edit requires Edit or Full', () => {
    expect(canEditCaseEntity('View')).toBe(false);
    expect(canEditCaseEntity('Edit')).toBe(true);
    expect(canEditCaseEntity('Full')).toBe(true);
    expect(canEditCaseEntity('None')).toBe(false);
  });

  it('delete requires Full only', () => {
    expect(canDeleteCaseEntity('Edit')).toBe(false);
    expect(canDeleteCaseEntity('Full')).toBe(true);
    expect(canDeleteCaseEntity('View')).toBe(false);
  });

  it('treats absent access level as not-permitted (callers gate the fallback)', () => {
    expect(canEditCaseEntity(undefined)).toBe(false);
    expect(canDeleteCaseEntity(undefined)).toBe(false);
  });
});
