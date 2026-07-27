import { Building2, UserPlus, Plus } from "lucide-react";
import { Card, EmptyState, Button } from "@/design-system";

interface Props {
  onCreateSite: () => void;
  onAddUsers: () => void;
}

/**
 * First-run onboarding cards, shown on the dashboard when the org has no sites
 * and no cases yet (Phase-0 contract §F). Preserves the two legacy CTAs:
 * create the first branch, and add users.
 */
export default function DashboardOnboarding({ onCreateSite, onAddUsers }: Props) {
  return (
    <div className="dash-grid-even" style={{ marginBottom: 22 }}>
      <Card pad>
        <EmptyState
          icon={Building2}
          title="Create your first site"
          description="Define a site (your firm's office or a practice area's workspace) before you can manage cases and users."
          action={
            <Button variant="primary" icon={Plus} onClick={onCreateSite}>
              Create site
            </Button>
          }
        />
      </Card>
      <Card pad>
        <EmptyState
          icon={UserPlus}
          title="Add your team"
          description="Invite your team members and assign them roles within a site and across the organization."
          action={
            <Button variant="secondary" icon={UserPlus} onClick={onAddUsers}>
              Add users
            </Button>
          }
        />
      </Card>
    </div>
  );
}
