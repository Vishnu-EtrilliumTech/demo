"use client";

import React, { useEffect, useRef } from "react";
import { CalendarClock, Trash2, TriangleAlert, X } from "lucide-react";
import { Dialog, Button, Field, Input, Textarea, Select } from "@/design-system";
import { HearingStatus, ContributorAccessLevel } from "@/app/organization/types/caseindex";
import { User } from "@/app/organization/types";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import CourtLocationAutocomplete from "@/components/CourtLocationAutocomplete";
import useGoogleMaps from "@/hooks/useGoogleMaps";
import { CourtLocationSearchResult } from "@/app/organization/services/ecourtapi";

interface HearingModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (onSuccess?: () => void) => Promise<void>;
  title: string;
  formData: {
    assignedToId: string;
    hearingDateTime: string;
    status: HearingStatus;
    courtName: string;
    /** Free-text Google Maps address for the hearing location. */
    googleMapLocation?: string;
    courtLocationId?: string;
    notes?: string;
    newAssigneeContributorAccessLevel?: ContributorAccessLevel;
  };
  onFormChange: (field: string, value: string | number) => void;
  errors: Record<string, string>;
  apiErrors: string[] | null;
  onSetApiErrors: (errors: string[] | null) => void;
  isSubmitting: boolean;
  siteUsers: User[];
  /**
   * User ids for whom the "Case Access for Assignee" field is hidden — anyone
   * the backend would not auto-grant as a contributor: the creator, main
   * assignee, existing contributors, or an admin. Sourced from the complement
   * of the backend's eligible-to-add list, so admins are detected reliably.
   */
  relatedUserIds?: string[];
  /** When true (edit mode only), shows a Delete Hearing action. */
  canDelete?: boolean;
  /** Called when the Delete Hearing action is clicked. */
  onDelete?: () => void;
}

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
}

export default function HearingModal({
  open,
  onClose,
  onSubmit,
  title,
  formData,
  onFormChange,
  errors,
  apiErrors,
  onSetApiErrors,
  isSubmitting,
  siteUsers,
  relatedUserIds = [],
  canDelete = false,
  onDelete,
}: HearingModalProps) {
  const isGoogleLoaded = useGoogleMaps();
  // Tracks whether the Location field is still "linked" to Court — true until
  // the user edits Location by hand, at which point Court changes stop
  // overwriting it (cleared/re-armed on clear, reset whenever the dialog opens).
  const locationIsLinkedToCourtRef = useRef(true);
  const geocodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      locationIsLinkedToCourtRef.current = !formData.googleMapLocation;
    }
    // Only reset when the dialog transitions open — not on every formData change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    };
  }, []);

  // Mirrors the Court text into Location immediately, then resolves it against
  // the Google Geocoding API (debounced) to replace it with a cleaner
  // formatted address once available. Only runs while Location is still linked.
  const mirrorCourtNameToLocation = (courtNameValue: string) => {
    if (!locationIsLinkedToCourtRef.current) return;
    onFormChange("googleMapLocation", courtNameValue);

    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    if (!courtNameValue.trim() || !isGoogleLoaded || !window.google?.maps) return;

    geocodeTimerRef.current = setTimeout(() => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: courtNameValue }, (results, status) => {
        if (!locationIsLinkedToCourtRef.current) return; // user edited Location meanwhile
        if (status === "OK" && results?.[0]?.formatted_address) {
          onFormChange("googleMapLocation", results[0].formatted_address);
        }
      });
    }, 600);
  };

  const handleSubmit = async () => {
    await onSubmit(() => onClose());
  };

  const handleCourtNameTextChange = (value: string) => {
    onFormChange("courtName", value);
    // Typing away from a previously picked court invalidates that selection —
    // clear it until the user picks a fresh suggestion (mirrors the backend's
    // own defensive clear of the stale CourtLocation nav on CourtLocationId change).
    onFormChange("courtLocationId", "");
    mirrorCourtNameToLocation(value);
  };

  const handleCourtLocationSelect = (item: CourtLocationSearchResult) => {
    onFormChange("courtName", item.display);
    onFormChange("courtLocationId", item.id);
    mirrorCourtNameToLocation(item.display);
  };

  const handleLocationTextChange = (value: string) => {
    // An empty Location re-arms auto-fill; any other manual edit detaches it
    // from Court until cleared again.
    locationIsLinkedToCourtRef.current = value.trim() === "";
    onFormChange("googleMapLocation", value);
  };

  const handleLocationPlaceSelect = (addressData: AddressData) => {
    locationIsLinkedToCourtRef.current = false;
    onFormChange("googleMapLocation", addressData.fullAddress);
  };

  const showAssigneeAccess =
    !!formData.assignedToId && !relatedUserIds.includes(formData.assignedToId);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      subtitle={
        title === "Add Hearing"
          ? "Schedule a new hearing for this case"
          : "Update hearing details"
      }
      icon={CalendarClock}
      footer={
        <>
          {canDelete && (
            <Button
              variant="ghost"
              icon={Trash2}
              onClick={onDelete}
              disabled={isSubmitting}
              style={{ marginRight: "auto", color: "#dc2626" }}
            >
              Delete Hearing
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={isSubmitting}
            onClick={handleSubmit}
          >
            {title === "Add Hearing" ? "Add Hearing" : "Save Changes"}
          </Button>
        </>
      }
    >
      {apiErrors && apiErrors.length > 0 && (
        <div className="form-alert" role="alert">
          <TriangleAlert aria-hidden />
          <span>{apiErrors.join(" ")}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => onSetApiErrors(null)}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "inherit",
              padding: 0,
            }}
          >
            <X width={16} height={16} aria-hidden />
          </button>
        </div>
      )}

      <Field
        label="Assigned To"
        required
        error={!!errors.assignedToId}
        hint={errors.assignedToId || undefined}
      >
        <Select
          value={formData.assignedToId || ""}
          onChange={(e) => onFormChange("assignedToId", e.target.value)}
        >
          <option value="">Unassigned</option>
          {siteUsers.map((user) => (
            <option key={user.id} value={String(user.id)}>
              {user.fullName}
            </option>
          ))}
        </Select>
      </Field>

      {/* Case access for assignee — only when an assignee is selected and
          not already related to the case (US4) */}
      {showAssigneeAccess && (
        <Field label="Case Access for Assignee">
          <Select
            value={String(
              formData.newAssigneeContributorAccessLevel ??
                ContributorAccessLevel.ViewOnly,
            )}
            onChange={(e) =>
              onFormChange(
                "newAssigneeContributorAccessLevel",
                Number(e.target.value),
              )
            }
          >
            <option value={ContributorAccessLevel.ViewOnly}>Viewer</option>
            <option value={ContributorAccessLevel.Edit}>Editor</option>
          </Select>
        </Field>
      )}

      <Field
        label="Status"
        required
        error={!!errors.status}
        hint={errors.status || undefined}
      >
        <Select
          value={formData.status}
          onChange={(e) => onFormChange("status", e.target.value as HearingStatus)}
        >
          {Object.values(HearingStatus).map((status) => (
            <option key={status} value={status}>
              {status.replace(/([A-Z])/g, " $1").trim()}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Hearing Date & Time"
        required
        error={!!errors.hearingDateTime}
        hint={errors.hearingDateTime || undefined}
      >
        <Input
          type="datetime-local"
          value={formData.hearingDateTime || ""}
          onChange={(e) => {
            onFormChange("hearingDateTime", e.target.value);
            // Chrome's datetime-local picker doesn't auto-close once a full
            // date + time is chosen — blur it so it dismisses like a plain
            // date input does.
            if (e.target.value) e.target.blur();
          }}
        />
      </Field>

      <Field label="Court" required>
        <CourtLocationAutocomplete
          value={formData.courtName}
          onChange={handleCourtNameTextChange}
          onCourtLocationSelect={handleCourtLocationSelect}
          placeholder="Search for a court, or enter a location manually"
          error={errors.courtName}
        />
      </Field>

      <Field label="Location">
        <AddressAutocomplete
          value={formData.googleMapLocation || ""}
          onChange={handleLocationTextChange}
          onPlaceSelect={handleLocationPlaceSelect}
          placeholder="Auto-filled from Court — search to override"
          error={errors.googleMapLocation}
        />
      </Field>

      <Field
        label="Notes"
        error={!!errors.notes}
        hint={errors.notes || undefined}
      >
        <Textarea
          rows={3}
          value={formData.notes || ""}
          onChange={(e) => onFormChange("notes", e.target.value)}
          placeholder="Enter hearing notes"
        />
      </Field>
    </Dialog>
  );
}
