"use client";

import React, { useState } from "react";
import { UsersRound, UserPlus, Pencil, Trash2 } from "lucide-react";

import { Card, SectionHead, Button, Pill, LoadingState, type PillTone } from "@/design-system";
import {
  AvailableUser,
  CaseContributor,
  ContributorAccessLevel,
} from "@/app/organization/types/caseindex";
import { DeleteConfirmationModal } from "@/components/modals/DeleteConfirmationModal";
import AddContributorModal from "@/components/modals/AddContributorModal";
import EditContributorAccessModal from "@/components/modals/EditContributorAccessModal";
import { colorForName, initialsForName } from "./contributorColors";

export interface ContributorsCardProps {
  contributors: CaseContributor[];
  loading: boolean;
  mutating: boolean;
  /** Add/edit/remove controls render only when true. */
  canManageContributors: boolean;
  /** Server-filtered users eligible to be added as contributors (feature 034). */
  availableUsers: AvailableUser[];
  loadingAvailableUsers?: boolean;
  onAdd: (
    userId: string,
    accessLevel: ContributorAccessLevel,
  ) => Promise<boolean>;
  onUpdate: (
    contributorId: string,
    accessLevel: ContributorAccessLevel,
  ) => Promise<boolean>;
  onRemove: (contributorId: string) => Promise<boolean>;
}

export const ContributorsCard: React.FC<ContributorsCardProps> = ({
  contributors,
  loading,
  mutating,
  canManageContributors,
  availableUsers,
  loadingAvailableUsers = false,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeContributor, setActiveContributor] =
    useState<CaseContributor | null>(null);

  const handleConfirmDelete = async () => {
    if (!activeContributor) return;
    const ok = await onRemove(activeContributor.id);
    if (ok) {
      setDeleteModalOpen(false);
      setActiveContributor(null);
    }
  };

  return (
    <Card pad>
      <SectionHead
        icon={UsersRound}
        title="Contributors"
        actions={
          canManageContributors ? (
            <Button
              variant="secondary"
              icon={UserPlus}
              onClick={() => setAddModalOpen(true)}
            >
              Add
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <LoadingState message="Loading contributors…" size="sm" />
      ) : contributors.length === 0 ? (
        <p style={{ fontSize: 14, color: "var(--text-2)", margin: 0 }}>
          No contributors yet.{" "}
          {canManageContributors && "Add someone to give them access to this case."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {contributors.map((contributor, i) => {
            const color = colorForName(contributor.userFullName);
            const isEditor = contributor.accessLevel === ContributorAccessLevel.Edit;
            const accessLabel = isEditor ? "Editor" : "Viewer";
            const accessTone: PillTone = isEditor ? "brand" : "neutral";
            return (
              <div
                key={contributor.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 0",
                  borderTop: i === 0 ? undefined : "1px solid var(--divider)",
                }}
              >
                <span className="who2" style={{ flex: 1, minWidth: 0 }}>
                  <span
                    className="a"
                    style={{ background: `${color}1A`, color }}
                    aria-hidden
                  >
                    {initialsForName(contributor.userFullName)}
                  </span>
                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={contributor.userFullName}
                  >
                    {contributor.userFullName}
                  </span>
                </span>

                <Pill tone={accessTone}>{accessLabel}</Pill>

                {canManageContributors && (
                  <>
                    <Button
                      variant="ghost"
                      icon={Pencil}
                      aria-label="Edit access"
                      title="Edit access"
                      onClick={() => {
                        setActiveContributor(contributor);
                        setEditModalOpen(true);
                      }}
                    />
                    <Button
                      variant="ghost"
                      icon={Trash2}
                      aria-label="Remove contributor"
                      title="Remove contributor"
                      onClick={() => {
                        setActiveContributor(contributor);
                        setDeleteModalOpen(true);
                      }}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManageContributors && (
        <>
          <AddContributorModal
            open={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            availableUsers={availableUsers}
            loadingAvailableUsers={loadingAvailableUsers}
            onAdd={onAdd}
            submitting={mutating}
          />

          <EditContributorAccessModal
            open={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setActiveContributor(null);
            }}
            contributor={activeContributor}
            onSave={(level) =>
              activeContributor
                ? onUpdate(activeContributor.id, level)
                : Promise.resolve(false)
            }
            submitting={mutating}
          />

          <DeleteConfirmationModal
            open={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setActiveContributor(null);
            }}
            onConfirm={handleConfirmDelete}
            entityType="contributor"
            entityName={activeContributor?.userFullName}
            loading={mutating}
          />
        </>
      )}
    </Card>
  );
};

export default ContributorsCard;
