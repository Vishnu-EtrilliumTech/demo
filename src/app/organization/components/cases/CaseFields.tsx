"use client";

import { useState } from "react";
import { Info, Globe2, Lock, Plus, Trash2, UserPlus } from "lucide-react";
import { Tooltip } from "@mui/material";
import { Field, Input, Textarea, Select, Toggle, Button } from "@/design-system";
import { CaseStatus } from "@/app/organization/types";
import { ContributorAccessLevel } from "@/app/organization/types/caseindex";
import {
  CASE_STATUS_ORDER,
  CASE_STATUS_LABEL,
} from "@/app/organization/components/caseStatusUi";
import type { useCaseForm, ClientRole } from "./useCaseForm";

type CaseFormApi = ReturnType<typeof useCaseForm>;

interface Props {
  form: CaseFormApi;
  mode: "create" | "edit";
  /**
   * Restricts rendering to one half of the field set — used by the paginated
   * Add-case dialog (step 3: case details, step 4: everything else). Omit to
   * render the full set in one page (CaseForm, QuickEditCaseDialog).
   */
  section?: "details" | "more";
  /**
   * Manual entry (vs. eCourts import). Swaps the fixed Petitioner/Respondent
   * inputs for a Client name + role model and surfaces the client-phone field.
   */
  isManual?: boolean;
}

/** Full-width grid cell for a non-Field block (spans both columns). */
const SPAN_FULL = { gridColumn: "1 / -1" } as const;

/**
 * Frontend-only fallback members for the "Add contributors" dropdown, used
 * (prototype) when no site users have loaded yet — e.g. before a site is picked.
 * Mirrors the demo roster elsewhere in the app.
 */
const MOCK_CONTRIBUTOR_MEMBERS: { id: string; fullName: string }[] = [
  { id: "m-202", fullName: "Rahul Verma" },
  { id: "m-203", fullName: "Priya Nair" },
  { id: "m-204", fullName: "Arjun Mehta" },
  { id: "m-205", fullName: "Sneha Reddy" },
  { id: "m-206", fullName: "Vikram Singh" },
];

/**
 * Shared Add/Edit case field set, laid out as a two-column grid so the form
 * stays compact (fits a dialog without scrolling on wide screens; collapses to
 * one column on narrow ones via `.form-2col`'s media query). Only the fields
 * the API persists are collected; the CNR field carries the eCourts sync note.
 *
 * Create mode additionally surfaces a set of frontend-only preview fields
 * (public/private access, "use case number as title", client phone identity
 * fallback, and court/party metadata) that are NOT sent to the backend yet.
 */
export default function CaseFields({ form, mode, section, isManual = false }: Props) {
  const {
    values,
    setField,
    errors,
    sites,
    users,
    loadingSites,
    loadingUsers,
    needsBranchPicker,
  } = form;
  const assigneeDisabled =
    loadingUsers || (needsBranchPicker && !values.branchId);
  const isCreate = mode === "create";
  const isManualCreate = isCreate && isManual;
  const showDetails = !section || section === "details";
  const showMore = !section || section === "more";

  const hasCaseNumber = !!values.caseNumber.trim();
  // Manual entry always collects a client phone (alongside the client name);
  // otherwise the field is an identity fallback shown only when there is
  // neither a title nor a case number — one of the three creates the case.
  const showClientPhone =
    isCreate && (isManualCreate || (!values.title.trim() && !hasCaseNumber));
  // Manual party model: once the client is named (or a phone given), ask which
  // side they are on and collect the opposing party.
  const showClientRole = isManualCreate && !!(values.clientName.trim() || values.clientPhone.trim());

  // Draft row for the inline "Add contributor" control (private access).
  const [draftMemberId, setDraftMemberId] = useState("");
  const [draftAccess, setDraftAccess] = useState<ContributorAccessLevel>(ContributorAccessLevel.ViewOnly);

  const addedIds = new Set(values.contributors.map((c) => c.userId));
  // Site users once a site is chosen; otherwise a mock roster so the prototype
  // dropdown is never empty. Both are frontend-only here.
  const allMembers: { id: string; fullName: string }[] =
    users.length > 0
      ? users.map((u) => ({ id: String(u.id ?? u.userId), fullName: u.fullName }))
      : MOCK_CONTRIBUTOR_MEMBERS;
  const memberOptions = allMembers.filter((u) => !addedIds.has(u.id));
  const nameForUser = (userId: string) =>
    allMembers.find((u) => u.id === userId)?.fullName ?? userId;

  const addContributor = () => {
    if (!draftMemberId || addedIds.has(draftMemberId)) return;
    setField("contributors", [...values.contributors, { userId: draftMemberId, accessLevel: draftAccess }]);
    setDraftMemberId("");
    setDraftAccess(ContributorAccessLevel.ViewOnly);
  };
  const removeContributor = (userId: string) =>
    setField("contributors", values.contributors.filter((c) => c.userId !== userId));

  return (
    <div className="form-2col">
      {showDetails && (
        <Field
          label="Case number"
          error={!!errors.caseNumber}
          hint={errors.caseNumber}
        >
          <Input
            value={values.caseNumber}
            onChange={(e) => setField("caseNumber", e.target.value)}
            placeholder="CS(COMM) 842/2024"
            maxLength={100}
          />
        </Field>
      )}

      {showDetails && (
        <Field label="Case title" error={!!errors.title} hint={errors.title}>
          <Input
            value={values.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g. Mehra Textiles Pvt. Ltd. v. State Bank of India"
            maxLength={200}
          />
        </Field>
      )}

      {mode === "edit" && (
        <Field label="Status" required error={!!errors.status} hint={errors.status || undefined}>
          <Select value={values.status} onChange={(e) => setField("status", e.target.value as CaseStatus)}>
            {CASE_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {CASE_STATUS_LABEL[s]}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Manual entry: client name, placed before the phone number. */}
      {showMore && isManualCreate && (
        <Field label="Client name" error={!!errors.identity} hint={errors.identity}>
          <Input
            value={values.clientName}
            onChange={(e) => setField("clientName", e.target.value)}
            placeholder="e.g. Ravi Shankar"
            maxLength={200}
          />
        </Field>
      )}

      {/* Client phone — always shown in manual entry (after the client name);
          otherwise an identity fallback when neither a title nor a case number exists. */}
      {showMore && showClientPhone && (
        <Field
          label="Client phone number"
          error={!isManualCreate && !!errors.identity}
          hint={!isManualCreate ? errors.identity : undefined}
        >
          <Input
            value={values.clientPhone}
            onChange={(e) => setField("clientPhone", e.target.value)}
            placeholder="e.g. +91 98765 43210"
            maxLength={20}
          />
        </Field>
      )}
      {showMore && isCreate && !showClientPhone && !isManualCreate && errors.identity && (
        <div className="field err" style={SPAN_FULL}>
          <div className="hint">{errors.identity}</div>
        </div>
      )}

      {/* Manual entry: which side the client is on, then the opposing party. */}
      {showMore && showClientRole && (
        <>
          <Field label="Client Type" required error={!!errors.clientRole} hint={errors.clientRole || undefined}>
            <Select
              value={values.clientRole}
              onChange={(e) => setField("clientRole", e.target.value as ClientRole)}
            >
              <option value="" disabled>
                Select type
              </option>
              <option value="petitioner">Petitioner</option>
              <option value="respondent">Respondent</option>
            </Select>
          </Field>
          {values.clientRole === "petitioner" && (
            <Field label="Respondent">
              <Input
                value={values.respondent}
                onChange={(e) => setField("respondent", e.target.value)}
                placeholder="e.g. State Bank of India"
                maxLength={200}
              />
            </Field>
          )}
          {values.clientRole === "respondent" && (
            <Field label="Petitioner">
              <Input
                value={values.petitioner}
                onChange={(e) => setField("petitioner", e.target.value)}
                placeholder="e.g. Mehra Textiles Pvt. Ltd."
                maxLength={200}
              />
            </Field>
          )}
        </>
      )}

      {showDetails && (
        <Field
          label={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              CNR number (eCourts)
              <Tooltip
                title="Adding a CNR links this matter to the eCourts record for live cause-list & hearing sync. You can add or change it later from the case workspace."
                arrow
                placement="top"
              >
                <Info width={13} height={13} aria-label="What is a CNR number?" style={{ cursor: "help" }} />
              </Tooltip>
            </span>
          }
          error={!!errors.cnrNumber}
          hint={errors.cnrNumber}
        >
          <Input
            value={values.cnrNumber}
            onChange={(e) => setField("cnrNumber", e.target.value)}
            placeholder="16-digit CNR — e.g. DLHC010132452024"
            maxLength={100}
          />
        </Field>
      )}

      {/* Frontend-only: case type. */}
      {showDetails && isCreate && (
        <Field label="Case type">
          <Input
            value={values.caseType}
            onChange={(e) => setField("caseType", e.target.value)}
            placeholder="e.g. Commercial Suit, Writ Petition, Appeal"
            maxLength={100}
          />
        </Field>
      )}

      {showMore && needsBranchPicker && (
        <Field label="Site" required error={!!errors.branchId} hint={errors.branchId || undefined}>
          <Select value={values.branchId} onChange={(e) => setField("branchId", e.target.value)} disabled={loadingSites}>
            <option value="" disabled>
              {loadingSites ? "Loading sites…" : "Select a site"}
            </option>
            {sites.map((s) => (
              <option key={s.id} value={String(s.id)}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {showMore && (
        <Field label="Assigned to" required={mode === "edit"} error={!!errors.assignedToId} hint={errors.assignedToId || undefined}>
          <Select value={values.assignedToId} onChange={(e) => setField("assignedToId", e.target.value)} disabled={assigneeDisabled}>
            <option value="" disabled={mode === "edit"}>
              {loadingUsers
                ? "Loading users…"
                : needsBranchPicker && !values.branchId
                  ? "Select a site first"
                  : mode === "edit"
                    ? "Select a user"
                    : "Select a user (optional)"}
            </option>
            {users.map((u) => (
              <option key={String(u.id ?? u.userId)} value={String(u.id ?? u.userId)}>
                {u.fullName}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Frontend-only: court + location (details) / party metadata (more). */}
      {showDetails && isCreate && (
        <>
          <Field label="Court">
            <Input
              value={values.court}
              onChange={(e) => setField("court", e.target.value)}
              placeholder="e.g. High Court of Delhi"
              maxLength={150}
            />
          </Field>
          <Field label="Court location">
            <Input
              value={values.courtLocation}
              onChange={(e) => setField("courtLocation", e.target.value)}
              placeholder="e.g. New Delhi"
              maxLength={150}
            />
          </Field>
        </>
      )}
      {showMore && isCreate && !isManual && (
        <>
          <Field label="Petitioner">
            <Input
              value={values.petitioner}
              onChange={(e) => setField("petitioner", e.target.value)}
              placeholder="e.g. Mehra Textiles Pvt. Ltd."
              maxLength={200}
            />
          </Field>
          <Field label="Respondent">
            <Input
              value={values.respondent}
              onChange={(e) => setField("respondent", e.target.value)}
              placeholder="e.g. State Bank of India"
              maxLength={200}
            />
          </Field>
        </>
      )}

      {showDetails && (
        <Field label="Description" full>
          <Textarea
            value={values.description}
            onChange={(e) => setField("description", e.target.value)}
            placeholder="Short summary of the matter, relief sought, background…"
            rows={2}
          />
        </Field>
      )}

      {/* Frontend-only: access mode. Defaults to public; the toggle's knob carries
          a globe/lock icon so the current state reads at a glance. Public access
          adds an org/site scope choice; private access reveals an optional
          inline contributor list. */}
      {showMore && isCreate && (
        <div className="settings-list" style={SPAN_FULL}>
          <div className="row">
            <div className="txt">
              <b>{values.isPublic ? "Public access" : "Private access"}</b>
              <span>
                {values.isPublic
                  ? "All users in the organization can view and edit this case; only users with delete access can remove it."
                  : "Only users with access to this case follow the normal workflow (view, edit, and delete per their permissions)."}
              </span>
            </div>
            <Toggle
              checked={values.isPublic}
              onChange={(next) => setField("isPublic", next)}
              aria-label="Public access"
              icon={values.isPublic ? Globe2 : Lock}
            />
          </div>

          {values.isPublic ? (
            <div className="row">
              <div className="txt">
                <b>Access level</b>
                <span>
                  {values.accessScope === "org"
                    ? "Everyone in the organization can access this case."
                    : "Everyone in the case's site can access it, including the org admin."}
                </span>
              </div>
              <div className="seg" role="radiogroup" aria-label="Access level">
                <button
                  type="button"
                  role="radio"
                  aria-checked={values.accessScope === "org"}
                  className={`seg-btn${values.accessScope === "org" ? " on" : ""}`}
                  onClick={() => setField("accessScope", "org")}
                >
                  Org level
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={values.accessScope === "site"}
                  className={`seg-btn${values.accessScope === "site" ? " on" : ""}`}
                  onClick={() => setField("accessScope", "site")}
                >
                  Site level
                </button>
              </div>
            </div>
          ) : (
            <div className="row" style={{ flexDirection: "column", alignItems: "stretch", gap: 12 }}>
              <div className="txt">
                <b>Add contributors</b>
                <span>Grant specific site members access to this case (optional).</span>
              </div>

              <div className="cd-add-row">
                <Field label="Member" className="cd-member">
                  <Select
                    value={draftMemberId}
                    disabled={memberOptions.length === 0}
                    onChange={(e) => setDraftMemberId(e.target.value)}
                  >
                    <option value="" disabled>
                      {memberOptions.length === 0 ? "No members to add" : "Search site members…"}
                    </option>
                    {memberOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Access level" className="cd-access-field">
                  <Select
                    value={String(draftAccess)}
                    onChange={(e) => setDraftAccess(Number(e.target.value) as ContributorAccessLevel)}
                  >
                    <option value={ContributorAccessLevel.ViewOnly}>Viewer</option>
                    <option value={ContributorAccessLevel.Edit}>Editor</option>
                  </Select>
                </Field>
                <Button variant="secondary" icon={Plus} onClick={addContributor} disabled={!draftMemberId}>
                  Add
                </Button>
              </div>

              {values.contributors.length > 0 && (
                <div className="contributor-drafts">
                  {values.contributors.map((c) => (
                    <div key={c.userId} className="contributor-draft-row">
                      <UserPlus width={15} height={15} aria-hidden style={{ color: "var(--brand)" }} />
                      <span className="cd-name">{nameForUser(c.userId)}</span>
                      <span className="cd-access">
                        {c.accessLevel === ContributorAccessLevel.Edit ? "Editor" : "Viewer"}
                      </span>
                      <button
                        type="button"
                        className="cd-remove"
                        aria-label={`Remove ${nameForUser(c.userId)}`}
                        onClick={() => removeContributor(c.userId)}
                      >
                        <Trash2 width={15} height={15} aria-hidden />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
