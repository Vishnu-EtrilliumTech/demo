'use client';

import OrgSidebar from '@/components/org/OrgSidebar';
import OrgHeader from '@/components/org/OrgHeader';
import OrgAppShell from '@/components/org/OrgAppShell';
import { useSearchParams } from 'next/navigation';
import { useFeatureFlag } from '@/design-system';

export default function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const id = searchParams.get('organizationId');
  const newShell = useFeatureFlag('shell');

  if (!id) {
    return <div>Error: Organization ID is required.</div>;
  }

  // New design-system shell (flag on), matching organization/[id]/layout.tsx.
  // Toggling the flag off restores the legacy shell below with zero
  // behavioural change.
  if (newShell) {
    return <OrgAppShell organizationId={id}>{children}</OrgAppShell>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <OrgSidebar organizationId={id} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <OrgHeader organizationId={id} />
        <main
          className="flex-1 overflow-y-auto"
          style={{
            background:
              'linear-gradient(135deg, #faf8f3 0%, #e8f5f0 35%, #ddeef5 60%, #ecdff0 80%, #f5e8e8 100%)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
