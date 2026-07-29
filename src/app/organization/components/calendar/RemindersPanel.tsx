"use client";

import { Bell, Gavel, ListTodo, StickyNote, Star } from "lucide-react";
import { Dialog, EmptyState, LoadingState } from "@/design-system";
import { useReminders } from "@/app/organization/hooks/useReminders";
import { priorityColor } from "@/app/organization/types/calendarTypes";

interface RemindersPanelProps {
  organizationId: string;
  onClose: () => void;
}

/** "My items" panel: the current user's own Tasks, Hearings, Notes, and favourite cases in one place. */
export default function RemindersPanel({ organizationId, onClose }: RemindersPanelProps) {
  const { reminders, isLoading } = useReminders(organizationId);

  return (
    <Dialog open onClose={onClose} title="Reminders" subtitle="Your Tasks, Hearings, Notes, and favourite cases" icon={Bell} wide>
      {isLoading || !reminders ? (
        <LoadingState message="Loading your items…" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section>
            <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, margin: "0 0 8px" }}>
              <Gavel size={16} /> Hearings ({reminders.hearings.length})
            </h3>
            {reminders.hearings.length === 0 ? (
              <EmptyState icon={Gavel} title="No hearings" description="You have no upcoming or past hearings." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {reminders.hearings.map((h) => (
                  <li key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderLeft: `3px solid ${priorityColor(h.priority)}`, paddingLeft: 8 }}>
                    <span>{new Date(h.date).toLocaleDateString()}</span>
                    <span>{h.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, margin: "0 0 8px" }}>
              <ListTodo size={16} /> Tasks ({reminders.tasks.length})
            </h3>
            {reminders.tasks.length === 0 ? (
              <EmptyState icon={ListTodo} title="No tasks" description="You have no tasks assigned or created." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {reminders.tasks.map((t) => (
                  <li key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderLeft: `3px solid ${priorityColor(t.priority)}`, paddingLeft: 8 }}>
                    <span>{new Date(t.date).toLocaleDateString()}</span>
                    <span>{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, margin: "0 0 8px" }}>
              <StickyNote size={16} /> Notes ({reminders.notes.length})
            </h3>
            {reminders.notes.length === 0 ? (
              <EmptyState icon={StickyNote} title="No notes" description="You have no notes created or tagged in." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {reminders.notes.map((n) => (
                  <li key={n.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, borderLeft: `3px solid ${priorityColor(n.priority)}`, paddingLeft: 8 }}>
                    <span>{new Date(n.date).toLocaleDateString()}</span>
                    <span>{n.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, margin: "0 0 8px" }}>
              <Star size={16} /> Favourite Cases ({reminders.favouriteCases.length})
            </h3>
            {reminders.favouriteCases.length === 0 ? (
              <EmptyState icon={Star} title="No favourite cases" description="Star a case from any case list to see it here." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {reminders.favouriteCases.map((c) => (
                  <li key={c.id} style={{ fontSize: 13 }}>
                    {c.title} <span style={{ opacity: 0.6 }}>({c.caseNumber})</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
}
