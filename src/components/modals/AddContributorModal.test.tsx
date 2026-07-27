import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import AddContributorModal from './AddContributorModal';
// The picker is a design-system <Select> (native combobox); its options and the
// loading/empty placeholders render directly in the DOM, so no dropdown-open
// interaction is needed.
import { AvailableUser, ContributorAccessLevel } from '@/app/organization/types/caseindex';

function makeAvailableUser(id: number, fullName: string): AvailableUser {
  return {
    id,
    fullName,
    email: `${fullName.replace(/\s/g, '').toLowerCase()}@example.com`,
  };
}

const availableUsers: AvailableUser[] = [
  makeAvailableUser(1, 'Alice Member'),
  makeAvailableUser(5, 'Erin Eligible'),
];

describe('AddContributorModal', () => {
  it('renders the server-provided eligible users in the picker', () => {
    render(
      <AddContributorModal
        open
        onClose={() => {}}
        availableUsers={availableUsers}
        onAdd={vi.fn().mockResolvedValue(true)}
      />
    );

    const memberSelect = screen.getByLabelText(/member/i);
    expect(within(memberSelect).getByText(/Alice Member/)).toBeInTheDocument();
    expect(within(memberSelect).getByText(/Erin Eligible/)).toBeInTheDocument();
  });

  it('submits the selected member and access level, then closes on success', async () => {
    const onAdd = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    render(
      <AddContributorModal
        open
        onClose={onClose}
        availableUsers={availableUsers}
        onAdd={onAdd}
      />
    );

    // Pick a member (option value is the user id)
    fireEvent.change(screen.getByLabelText(/member/i), { target: { value: '1' } });

    // Choose Editor access level
    fireEvent.change(screen.getByLabelText(/access level/i), {
      target: { value: String(ContributorAccessLevel.Edit) },
    });

    fireEvent.click(screen.getByRole('button', { name: /add contributor/i }));

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith(1, ContributorAccessLevel.Edit);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('stays open when the add fails (backend error surfaced via toast upstream)', async () => {
    const onAdd = vi.fn().mockResolvedValue(false);
    const onClose = vi.fn();
    render(
      <AddContributorModal
        open
        onClose={onClose}
        availableUsers={availableUsers}
        onAdd={onAdd}
      />
    );

    fireEvent.change(screen.getByLabelText(/member/i), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: /add contributor/i }));

    await waitFor(() => expect(onAdd).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows an empty-state message when no members are eligible', () => {
    render(
      <AddContributorModal
        open
        onClose={() => {}}
        availableUsers={[]}
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByText('No eligible members to add')).toBeInTheDocument();
  });

  it('shows a loading message while the eligible list is loading', () => {
    render(
      <AddContributorModal
        open
        onClose={() => {}}
        availableUsers={[]}
        loadingAvailableUsers
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByText('Loading members…')).toBeInTheDocument();
  });
});
