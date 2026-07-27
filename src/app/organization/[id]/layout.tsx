'use client';

import { use, useState } from 'react';
import OrgSidebar from '@/components/org/OrgSidebar';
import OrgHeader from '@/components/org/OrgHeader';
import OrgAppShell from '@/components/org/OrgAppShell';
import { useFeatureFlag } from '@/design-system';

export default function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [mobileOpen, setMobileOpen] = useState(false);
  const newShell = useFeatureFlag('shell');

  // New design-system shell (flag on). Toggling the flag off restores the
  // legacy shell below with zero behavioural change.
  if (newShell) {
    return <OrgAppShell organizationId={id}>{children}</OrgAppShell>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <OrgSidebar
        organizationId={id}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <OrgHeader
          organizationId={id}
          onMobileMenuToggle={() => setMobileOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
