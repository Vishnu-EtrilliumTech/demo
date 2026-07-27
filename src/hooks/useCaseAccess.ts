import { useMemo } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import {
  CaseAccess,
  CaseAccessLevel,
  CaseApiAccessLevel,
  CaseContributor,
  ContributorAccessLevel,
  parseCaseApiAccessLevel,
} from '@/app/organization/types/caseindex';

/**
 * Inputs for the pure case-access computation. All data is already loaded
 * (roles, case identity, contributors) — this function never hits the network.
 */
export interface ComputeCaseAccessInput {
  roles: string[];
  currentUserId: string | null;
  createdById: string | null;
  assignedToId: string | null;
  contributors: CaseContributor[];
}

/**
 * Pure, unit-testable mirror of the backend access resolution. The backend
 * remains the authorization source of truth (Constitution IV); this only
 * decides which controls render. Per clarification Q1, controls that fail a
 * check are hidden, not disabled.
 *
 * First match wins — rows are evaluated in order (see contracts/access-ladder.md).
 */
export function computeCaseAccess(
  input: ComputeCaseAccessInput
): Omit<CaseAccess, 'isLoading'> {
  const { roles, currentUserId, createdById, assignedToId, contributors } = input;

  const has = (role: string) => roles.includes(role);

  // empty/null user id is "no creator/assignee" and never matches identity rows
  const uid = currentUserId ? currentUserId : null;
  const isCreator = uid !== null && uid === createdById;
  const isAssignee = uid !== null && uid === assignedToId;

  // CaseContributor.userId is still `number` pending its own GUID retype (see
  // tasks.md T038); bridge the comparison here so identity matching stays
  // correct in the interim.
  const myContrib =
    uid !== null
      ? contributors.find((c) => String(c.userId) === uid) ?? null
      : null;
  const contributorLevel = myContrib?.accessLevel ?? null;

  const canManageContributors =
    has('SystemAdmin') ||
    has('OrganizationAdmin') ||
    has('SiteAdmin') ||
    isCreator ||
    isAssignee;

  let entityLevel = CaseAccessLevel.None;
  let resourceLevel = CaseAccessLevel.None;

  if (has('SystemAdmin') || has('OrganizationAdmin') || has('SiteAdmin')) {
    // Rows 1–3
    entityLevel = CaseAccessLevel.Full;
    resourceLevel = CaseAccessLevel.Full;
  } else if (has('SiteSrLegalExpert')) {
    // Row 4 — resource exceeds entity
    entityLevel = CaseAccessLevel.Edit;
    resourceLevel = CaseAccessLevel.Full;
  } else if (has('OrganizationClerk')) {
    // Row 5
    entityLevel = CaseAccessLevel.View;
    resourceLevel = CaseAccessLevel.View;
  } else if (isCreator && !has('SiteClerk')) {
    // Row 6 — a SiteClerk who created the case does NOT get creator privileges
    entityLevel = CaseAccessLevel.Edit;
    resourceLevel = CaseAccessLevel.Full;
  } else if (isAssignee) {
    // Row 7
    entityLevel = CaseAccessLevel.Edit;
    resourceLevel = CaseAccessLevel.Full;
  } else if (contributorLevel === ContributorAccessLevel.Edit) {
    // Row 8 — contributor caps at granted level on resources (never delete)
    entityLevel = CaseAccessLevel.Edit;
    resourceLevel = CaseAccessLevel.Edit;
  } else if (contributorLevel === ContributorAccessLevel.ViewOnly) {
    // Row 9
    entityLevel = CaseAccessLevel.View;
    resourceLevel = CaseAccessLevel.View;
  }

  return { entityLevel, resourceLevel, contributorLevel, canManageContributors };
}

export interface UseCaseAccessArgs {
  organizationId: string;
  createdById: string | null | undefined;
  assignedToId: string | null | undefined;
  contributors: CaseContributor[];
  /** True while the contributor list is still loading (folded into isLoading). */
  contributorsLoading?: boolean;
  /**
   * Authoritative per-case access level from the case read response (feature:
   * contributors). When present it overrides the locally-computed entity level,
   * so Edit/Delete gating matches what the backend actually enforces (e.g. a
   * Site Clerk who sees a case as view-only). Sub-resource gating still uses the
   * local computation, since the backend hint reflects the case entity only.
   */
  apiAccessLevel?: CaseApiAccessLevel | string | null;
}

export interface UseCaseAccessResult extends CaseAccess {
  // derived control predicates (consumer-side helpers)
  canViewCase: boolean;
  canEditCase: boolean;
  canDeleteCase: boolean;
  canCreateOrEditResource: boolean;
  canDeleteResource: boolean;
}

/**
 * Memoized hook wrapper around {@link computeCaseAccess}. Sources roles and
 * current-user identity from `useUserRole`. While access is still resolving
 * (`isLoading`), consumers should render the read-only view to avoid flashing
 * controls the user may not have.
 */
export function useCaseAccess(args: UseCaseAccessArgs): UseCaseAccessResult {
  const {
    organizationId,
    createdById,
    assignedToId,
    contributors,
    contributorsLoading = false,
    apiAccessLevel,
  } = args;

  const { allRoles, currentUserId, isLoading: rolesLoading } =
    useUserRole(organizationId);

  const computed = useMemo(
    () =>
      computeCaseAccess({
        roles: allRoles,
        currentUserId: currentUserId ?? null,
        createdById: createdById ?? null,
        assignedToId: assignedToId ?? null,
        contributors,
      }),
    [allRoles, currentUserId, createdById, assignedToId, contributors]
  );

  const isLoading = rolesLoading || contributorsLoading;

  // The backend hint, when present, is authoritative for the case *entity* and
  // overrides the local mirror. Resource-level gating keeps the local value,
  // since the hint reflects the case entity only (sub-resources differ).
  const apiEntityLevel = parseCaseApiAccessLevel(apiAccessLevel);
  const entityLevel = apiEntityLevel ?? computed.entityLevel;

  return {
    ...computed,
    entityLevel,
    isLoading,
    canViewCase: entityLevel >= CaseAccessLevel.View,
    canEditCase: entityLevel >= CaseAccessLevel.Edit,
    canDeleteCase: entityLevel === CaseAccessLevel.Full,
    canCreateOrEditResource: computed.resourceLevel >= CaseAccessLevel.Edit,
    canDeleteResource: computed.resourceLevel === CaseAccessLevel.Full,
  };
}
