"use client";

import { use, useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Card, SectionHead, Button, EmptyState } from "@/design-system";
import { useUserRole } from "@/hooks/useUserRole";
import { fetchOrganization } from "@/app/organization/services/api";
import { updateOrganizationDefaultCalendarItemTypes } from "@/app/organization/services/calendarApi";
import { useToast } from "@/contexts/ToastContext";
import type { CalendarItemType } from "@/app/organization/types/calendarTypes";

const ALL_TYPES: { key: CalendarItemType; label: string }[] = [
  { key: "Hearing", label: "Hearings" },
  { key: "Task", label: "Tasks" },
  { key: "Note", label: "Notes" },
];

/**
 * Minimal Org Settings page. Today this hosts a single control — the
 * Calendar's default item-type filter (FR-007) — since no broader Settings
 * surface exists yet in this prototype.
 */
export default function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: organizationId } = use(params);
  const { canConfigureCalendarDefaults, isLoading: roleLoading } = useUserRole(organizationId);
  const { showSuccess, showError } = useToast();
  const [types, setTypes] = useState<CalendarItemType[]>(["Hearing", "Task", "Note"]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchOrganization(organizationId)
      .then((org) => {
        if (org.defaultCalendarItemTypes && org.defaultCalendarItemTypes.length > 0) {
          setTypes(org.defaultCalendarItemTypes);
        }
      })
      .finally(() => setIsLoading(false));
  }, [organizationId]);

  const toggleType = (key: CalendarItemType) => {
    setTypes((prev) => (prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateOrganizationDefaultCalendarItemTypes(organizationId, types.length > 0 ? types : null);
      showSuccess("Default Calendar Filters updated.");
    } catch {
      showError("Failed to update Default Calendar Filters.");
    } finally {
      setIsSaving(false);
    }
  };

  if (roleLoading || isLoading) return null;

  if (!canConfigureCalendarDefaults) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="Not available"
        description="Only Organization Admins can configure Organization Settings."
      />
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 640 }}>
      <Card>
        <SectionHead title="Default Calendar Filters" />
        <p style={{ fontSize: 13, opacity: 0.75, margin: "8px 0 16px" }}>
          The item types checked by default when anyone in this organization opens the Calendar. Users may still change this for their own session.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "12px 0 20px" }}>
          {ALL_TYPES.map((t) => (
            <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
              <input type="checkbox" checked={types.includes(t.key)} onChange={() => toggleType(t.key)} />
              {t.label}
            </label>
          ))}
        </div>
        <Button variant="primary" loading={isSaving} onClick={handleSave}>
          Save
        </Button>
      </Card>
    </div>
  );
}
