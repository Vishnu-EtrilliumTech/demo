import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditContributorAccessModal from './EditContributorAccessModal';
import {
  CaseContributor,
  ContributorAccessLevel,
} from '@/app/organization/types/caseindex';

const contributor: CaseContributor = {
  id: '77777777-7777-7777-7777-777777777777',
  caseId: '10101010-1010-1010-1010-101010101010',
  userId: '55555555-5555-5555-5555-555555555555',
  userFullName: 'Jane Doe',
  userEmail: 'jane@example.com',
  accessLevel: ContributorAccessLevel.ViewOnly,
  addedById: '11111111-1111-1111-1111-111111111111',
  addedByFullName: 'Admin',
  createdDate: '2026-06-16T00:00:00+00:00',
};

describe('EditContributorAccessModal', () => {
  it('pre-selects the contributor current access level and shows their name', () => {
    render(
      <EditContributorAccessModal
        open
        onClose={() => {}}
        contributor={contributor}
        onSave={vi.fn().mockResolvedValue(true)}
      />
    );
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('saves the newly selected level and closes on success', async () => {
    const onSave = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <EditContributorAccessModal
        open
        onClose={onClose}
        contributor={contributor}
        onSave={onSave}
      />
    );

    // Pick "Editor" on the design-system native select
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: String(ContributorAccessLevel.Edit) },
    });

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(ContributorAccessLevel.Edit);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not close when save fails', async () => {
    const onSave = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <EditContributorAccessModal
        open
        onClose={onClose}
        contributor={contributor}
        onSave={onSave}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });
});
