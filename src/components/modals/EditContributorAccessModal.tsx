'use client';

import React, { useEffect, useState } from 'react';
import { UserCog } from 'lucide-react';
import { Dialog, Field, Select, Button } from '@/design-system';
import {
  CaseContributor,
  ContributorAccessLevel,
} from '@/app/organization/types/caseindex';

interface EditContributorAccessModalProps {
  open: boolean;
  onClose: () => void;
  contributor: CaseContributor | null;
  /** Saves the new level. Resolves true on success so the modal can close itself. */
  onSave: (accessLevel: ContributorAccessLevel) => Promise<boolean>;
  submitting?: boolean;
}

export default function EditContributorAccessModal({
  open,
  onClose,
  contributor,
  onSave,
  submitting = false,
}: EditContributorAccessModalProps) {
  const [accessLevel, setAccessLevel] = useState<ContributorAccessLevel>(
    ContributorAccessLevel.ViewOnly
  );

  useEffect(() => {
    if (contributor) {
      setAccessLevel(contributor.accessLevel);
    }
  }, [contributor]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleSubmit = async () => {
    const ok = await onSave(accessLevel);
    if (ok) onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      small
      title="Edit Access Level"
      subtitle={contributor ? contributor.userFullName : undefined}
      icon={UserCog}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={submitting || !contributor}
          >
            Save
          </Button>
        </>
      }
    >
      <Field label="Access Level" htmlFor="edit-contributor-access">
        <Select
          id="edit-contributor-access"
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
