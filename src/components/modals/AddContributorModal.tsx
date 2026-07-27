'use client';

import React, { useState } from 'react';
import { UserPlus, TriangleAlert } from 'lucide-react';
import { Dialog, Field, Select, Button } from '@/design-system';
import { AvailableUser, ContributorAccessLevel } from '@/app/organization/types/caseindex';

interface AddContributorModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Users eligible to be added as contributors, already filtered server-side
   * (feature 034) to exclude the creator, assignee, existing contributors, and
   * admins. Rendered as-is — no client-side filtering.
   */
  availableUsers: AvailableUser[];
  loadingAvailableUsers?: boolean;
  /** Submits the add. Resolves true on success so the modal can close itself. */
  onAdd: (userId: string, accessLevel: ContributorAccessLevel) => Promise<boolean>;
  submitting?: boolean;
}

export default function AddContributorModal({
  open,
  onClose,
  availableUsers,
  loadingAvailableUsers = false,
  onAdd,
  submitting = false,
}: AddContributorModalProps) {
  const [selectedUser, setSelectedUser] = useState<AvailableUser | null>(null);
  const [accessLevel, setAccessLevel] = useState<ContributorAccessLevel>(
    ContributorAccessLevel.ViewOnly
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    setSelectedUser(null);
    setAccessLevel(ContributorAccessLevel.ViewOnly);
    setValidationError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedUser) {
      setValidationError('Please select a member to add.');
      return;
    }
    setValidationError(null);
    const ok = await onAdd(selectedUser.id, accessLevel);
    if (ok) {
      setSelectedUser(null);
      setAccessLevel(ContributorAccessLevel.ViewOnly);
      onClose();
    }
  };

  const memberPlaceholder = loadingAvailableUsers
    ? 'Loading members…'
    : availableUsers.length === 0
      ? 'No eligible members to add'
      : 'Search site members…';

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Add Contributor"
      subtitle="Grant a site member access to this case"
      icon={UserPlus}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || !selectedUser}
          >
            Add Contributor
          </Button>
        </>
      }
    >
      {validationError && (
        <div className="form-alert" role="alert">
          <TriangleAlert aria-hidden />
          <span>{validationError}</span>
        </div>
      )}

      <Field label="Member" required htmlFor="add-contributor-member">
        <Select
          id="add-contributor-member"
          value={selectedUser ? String(selectedUser.id) : ''}
          disabled={loadingAvailableUsers || availableUsers.length === 0}
          onChange={(e) =>
            setSelectedUser(
              availableUsers.find((u) => String(u.id) === e.target.value) ?? null
            )
          }
        >
          <option value="" disabled>
            {memberPlaceholder}
          </option>
          {availableUsers.map((user) => (
            <option key={String(user.id)} value={String(user.id)}>
              {user.email ? `${user.fullName} (${user.email})` : user.fullName}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Access Level" required htmlFor="add-contributor-access">
        <Select
          id="add-contributor-access"
          value={String(accessLevel)}
          onChange={(e) =>
            setAccessLevel(Number(e.target.value) as ContributorAccessLevel)
          }
        >
          <option value={ContributorAccessLevel.ViewOnly}>Viewer</option>
          <option value={ContributorAccessLevel.Edit}>Editor</option>
        </Select>
      </Field>
    </Dialog>
  );
}
