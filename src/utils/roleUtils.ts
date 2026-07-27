const ROLE_LABELS: Record<string, string> = {
  OrganizationAdmin: 'Organization Admin',
  OrganizationClerk: 'Organization Clerk',
  SiteAdmin: 'Site Admin',
  SiteClerk: 'Site Clerk',
  SiteLegalExpert: 'Legal Expert',
  SiteSrLegalExpert: 'Senior Legal Expert',
  SiteCaseClient: 'Case Client',
  SystemAdmin: 'System Admin',
  Client: 'Client',
  LegalIndividualExpert: 'Legal Expert',
  // Normalise space-separated variants sent by some API responses
  'Organization Admin': 'Organization Admin',
  'Organization Clerk': 'Organization Clerk',
};

export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role;
}
