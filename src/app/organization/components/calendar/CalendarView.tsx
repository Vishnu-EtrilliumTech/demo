"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, Gavel, ListTodo, StickyNote, Bell } from "lucide-react";
import { Dialog, Field } from "@/design-system";
import HearingModal from "@/components/modals/HearingModal";
import { CasePickerAutocomplete } from "@/components/modals/CasePickerAutocomplete";
import { useUserRole } from "@/hooks/useUserRole";
import { fetchOrganizationSites, fetchOrganizationUsers } from "@/app/organization/services/api";
import { addCaseHearing } from "@/app/organization/services/caseapi";
import { HearingStatus } from "@/app/organization/types/caseindex";
import type { Case, Site, User } from "@/app/organization/types";
import type { CalendarItem, Note, OrgTask, Priority } from "@/app/organization/types/calendarTypes";
import { useCalendarItems, type CalendarViewMode } from "@/app/organization/hooks/useCalendarItems";
import { useNotes } from "@/app/organization/hooks/useNotes";
import { useTasks } from "@/app/organization/hooks/useTasks";
import { setHearingPriority, fetchNote, fetchTask } from "@/app/organization/services/calendarApi";
import MiniCalendar from "./MiniCalendar";
import CalendarFilterBar from "./CalendarFilterBar";
import CalendarMonthView from "./CalendarMonthView";
import CalendarWeekView from "./CalendarWeekView";
import CalendarDayView from "./CalendarDayView";
import NoteModal, { type NoteFormValue } from "./NoteModal";
import TaskModal, { type TaskFormValue } from "./TaskModal";
import RemindersPanel from "./RemindersPanel";
import { addMonths, addDays, formatMonthYear, toDatetimeLocalValue } from "./calendarDateUtils";
import "./calendarGrid.css";

interface CalendarViewProps {
  scope: "org" | "site";
  organizationId: string;
  siteId?: string;
}

type AddKind = "Hearing" | "Task" | "Note" | null;

/** Clamps a small popover near a clicked element's rect so it stays on-screen. */
function positionNear(rect: DOMRect, width = 220, height = 160): { top: number; left: number } {
  let left = rect.left;
  let top = rect.bottom + 6;
  if (typeof window !== "undefined") {
    if (left + width > window.innerWidth - 12) left = window.innerWidth - width - 12;
    if (top + height > window.innerHeight - 12) top = Math.max(8, rect.top - height - 6);
  }
  return { top: Math.max(8, top), left: Math.max(8, left) };
}

const emptyHearingForm = (seedDate?: Date | null) => ({
  assignedToId: "",
  hearingDateTime: seedDate ? toDatetimeLocalValue(seedDate) : "",
  status: HearingStatus.Scheduled,
  courtName: "",
  googleMapLocation: "",
  courtLocationId: "",
  notes: "",
  priority: null as Priority,
});

export default function CalendarView({ scope, organizationId, siteId }: CalendarViewProps) {
  const { canCreateNote, canCreateTask, canViewCalendar } = useUserRole(organizationId);
  const cal = useCalendarItems({ organizationId, fixedSiteId: scope === "site" ? siteId : undefined });

  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [miniMonth, setMiniMonth] = useState(() => new Date());
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addKind, setAddKind] = useState<AddKind>(null);
  // Set when the user clicks a specific day cell / time slot on the grid — a
  // small popup opens near the click offering Hearing/Task/Note (popoverPos
  // controls the popup itself); whichever type is chosen defaults its date
  // field to pendingSeedDate rather than "now" (mirrors the
  // click-a-day-to-create convention from the retired Diary scaffolding).
  // pendingSeedDate outlives the popup's own open/closed state — it stays set
  // through the rest of the create flow until the item modal closes.
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number } | null>(null);
  const [pendingSeedDate, setPendingSeedDate] = useState<Date | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const viewMenuRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Hearing creation flow: pick a case first, then open the full Hearing form.
  const [hearingCase, setHearingCase] = useState<Case | null>(null);
  const [hearingForm, setHearingForm] = useState(emptyHearingForm());
  const [isSubmittingHearing, setIsSubmittingHearing] = useState(false);

  // Note/Task edit targets (null = creating new)
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editingTask, setEditingTask] = useState<OrgTask | null>(null);

  const notesHook = useNotes(organizationId);
  const tasksHook = useTasks(organizationId);

  useEffect(() => {
    fetchOrganizationSites(organizationId, { pageSize: 100 }).then((p) => setSites(p.items)).catch(() => setSites([]));
    fetchOrganizationUsers(organizationId, { pageSize: 200 }).then((p) => setUsers(p.items)).catch(() => setUsers([]));
  }, [organizationId]);

  useEffect(() => {
    setMiniMonth(new Date(cal.anchorDate.getFullYear(), cal.anchorDate.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cal.anchorDate.getFullYear(), cal.anchorDate.getMonth()]);

  const goToday = () => {
    cal.setAnchorDate(new Date());
    setSelectedDate(new Date());
  };
  const goPrev = () => {
    if (cal.view === "month") cal.setAnchorDate((d) => addMonths(d, -1));
    else if (cal.view === "week") cal.setAnchorDate((d) => addDays(d, -7));
    else cal.setAnchorDate((d) => addDays(d, -1));
  };
  const goNext = () => {
    if (cal.view === "month") cal.setAnchorDate((d) => addMonths(d, 1));
    else if (cal.view === "week") cal.setAnchorDate((d) => addDays(d, 7));
    else cal.setAnchorDate((d) => addDays(d, 1));
  };

  const headerLabel = () => {
    if (cal.view === "month") return formatMonthYear(cal.anchorDate);
    if (cal.view === "day") {
      return cal.anchorDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }
    return formatMonthYear(cal.anchorDate);
  };

  const onItemClick = async (item: CalendarItem) => {
    if (item.itemType === "Hearing") {
      window.location.href = `/organization/${organizationId}/sites/${item.siteId}/cases/${item.caseId}?tab=hearings`;
      return;
    }
    if (item.itemType === "Task") {
      const full = await fetchTask(organizationId, item.id, item.siteId ?? undefined);
      setEditingTask(full);
      setAddKind("Task");
      return;
    }
    if (item.itemType === "Note") {
      const full = await fetchNote(organizationId, item.id, item.siteId ?? undefined);
      setEditingNote(full);
      setAddKind("Note");
    }
  };

  const onPriorityChange = async (item: CalendarItem, priority: Priority) => {
    if (item.itemType === "Hearing" && item.siteId && item.caseId) {
      await setHearingPriority(organizationId, item.siteId, item.caseId, item.id, priority);
    } else if (item.itemType === "Task") {
      await tasksHook.quickSetPriority(item.id, priority, item.siteId ?? undefined);
    } else if (item.itemType === "Note") {
      await notesHook.quickSetPriority(item.id, priority, item.siteId ?? undefined);
    }
    cal.refetch();
  };

  const openAdd = (kind: AddKind) => {
    setAddMenuOpen(false);
    setPopoverPos(null);
    setAddKind(kind);
    setEditingNote(null);
    setEditingTask(null);
    if (kind === "Hearing") {
      setHearingCase(null);
      setHearingForm(emptyHearingForm(pendingSeedDate));
    }
  };

  const closeAdd = () => {
    setAddKind(null);
    setEditingNote(null);
    setEditingTask(null);
    setHearingCase(null);
    setPendingSeedDate(null);
  };

  /** Clicking a day cell (Month view) or time slot (Week/Day view) opens a
   * small popup near the click with Hearing/Task/Note choices, seeded with
   * that date so the chosen item type defaults to the date/time clicked
   * rather than "now". */
  const onGridDateClick = (d: Date, e: ReactMouseEvent<HTMLElement>) => {
    cal.setAnchorDate(d);
    setPendingSeedDate(d);
    setPopoverPos(positionNear(e.currentTarget.getBoundingClientRect()));
  };

  const handleSubmitNote = async (value: NoteFormValue) => {
    const siteIdForNote = value.scope === "Site" ? value.siteId : value.scope === "Case" ? value.linkedCase?.siteId : undefined;
    const request = {
      organizationId,
      siteId: siteIdForNote,
      caseId: value.scope === "Case" ? value.linkedCase?.id : undefined,
      title: value.title,
      body: value.body,
      noteDate: new Date(value.noteDate).toISOString(),
      taggedUserIds: value.taggedUserIds,
      priority: value.priority,
    };
    if (editingNote) {
      await notesHook.editNote(editingNote.id, request, siteIdForNote);
    } else {
      await notesHook.createNote(request, siteIdForNote);
    }
    closeAdd();
    cal.refetch();
  };

  const handleDeleteNote = async () => {
    if (!editingNote) return;
    await notesHook.removeNote(editingNote.id, editingNote.siteId ?? undefined);
    closeAdd();
    cal.refetch();
  };

  const handleSubmitTask = async (value: TaskFormValue) => {
    const siteIdForTask = value.scope === "Site" ? value.siteId : value.scope === "Case" ? value.linkedCase?.siteId : undefined;
    const request = {
      organizationId,
      siteId: siteIdForTask,
      caseId: value.scope === "Case" ? value.linkedCase?.id : undefined,
      title: value.title,
      description: value.description,
      // A Task with no explicit due date still needs a date to render on a
      // date-based Calendar — default to "today" rather than silently
      // becoming invisible (Due Date remains optional in the form itself).
      dueDate: (value.dueDate ? new Date(value.dueDate) : new Date()).toISOString(),
      status: value.status,
      assignedToId: value.assignedToId || undefined,
      priority: value.priority,
    };
    if (editingTask) {
      await tasksHook.editTask(editingTask.id, request, siteIdForTask);
    } else {
      await tasksHook.createTask(request, siteIdForTask);
    }
    closeAdd();
    cal.refetch();
  };

  const handleDeleteTask = async () => {
    if (!editingTask) return;
    await tasksHook.removeTask(editingTask.id, editingTask.siteId ?? undefined);
    closeAdd();
    cal.refetch();
  };

  const handleSubmitHearing = async () => {
    if (!hearingCase?.siteId) return;
    setIsSubmittingHearing(true);
    try {
      await addCaseHearing(organizationId, hearingCase.siteId, hearingCase.id, {
        assignedToId: hearingForm.assignedToId,
        hearingDateTime: hearingForm.hearingDateTime ? new Date(hearingForm.hearingDateTime).toISOString() : "",
        status: hearingForm.status,
        courtName: hearingForm.courtName,
        googleMapLocation: hearingForm.googleMapLocation,
        courtLocationId: hearingForm.courtLocationId || undefined,
        notes: hearingForm.notes,
        priority: hearingForm.priority,
      });
      setAddKind(null);
      setHearingCase(null);
      cal.refetch();
    } finally {
      setIsSubmittingHearing(false);
    }
  };

  if (!canViewCalendar) return null;

  return (
    <div className="gcal-root">
      <header className="gcal-topbar">
        <div className="gcal-brand">
          <span className="gcal-logo-icon">
            <span className="gcal-logo-date">{today.getDate()}</span>
          </span>
          <span className="gcal-brand-word">Calendar</span>
        </div>
        <button type="button" className="gcal-today-btn" onClick={goToday}>
          Today
        </button>
        <div className="gcal-nav-arrows">
          <button type="button" className="gcal-icon-btn" aria-label="Previous" onClick={goPrev}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="gcal-icon-btn" aria-label="Next" onClick={goNext}>
            <ChevronRight size={20} />
          </button>
        </div>
        <h1 className="gcal-header-label">{headerLabel()}</h1>
        <div className="gcal-grow" />
        <button type="button" className="gcal-icon-btn" aria-label="Reminders" onClick={() => setRemindersOpen(true)}>
          <Bell size={20} />
        </button>
        <div className="gcal-viewmenu" ref={viewMenuRef}>
          <button type="button" className="gcal-viewmenu-btn" onClick={() => setViewMenuOpen((v) => !v)}>
            {cal.view[0].toUpperCase() + cal.view.slice(1)}
            <ChevronDown size={16} />
          </button>
          {viewMenuOpen && (
            <div className="gcal-viewmenu-list">
              {(["day", "week", "month"] as CalendarViewMode[]).map((v) => (
                <button
                  type="button"
                  key={v}
                  className={`gcal-viewmenu-item${cal.view === v ? " active" : ""}`}
                  onClick={() => {
                    cal.setView(v);
                    setViewMenuOpen(false);
                  }}
                >
                  {v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="gcal-body">
        <button
          type="button"
          className={`gcal-sidebar-toggle${sidebarCollapsed ? " collapsed" : ""}`}
          aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
          aria-expanded={!sidebarCollapsed}
          onClick={() => setSidebarCollapsed((v) => !v)}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <aside className={`gcal-sidebar${sidebarCollapsed ? " collapsed" : ""}`} aria-hidden={sidebarCollapsed}>
          <div className="gcal-create-menu" ref={addMenuRef}>
            <button
              type="button"
              className="gcal-create-btn"
              onClick={() => {
                setPendingSeedDate(null);
                setPopoverPos(null);
                setAddMenuOpen((v) => !v);
              }}
            >
              <span className="gcal-create-plus">
                <Plus size={22} />
              </span>
              Create
            </button>
            {addMenuOpen && (
              <div className="gcal-create-menu-list">
                <button type="button" className="gcal-create-menu-item" onClick={() => openAdd("Hearing")}>
                  <Gavel size={16} /> Hearing
                </button>
                {canCreateTask && (
                  <button type="button" className="gcal-create-menu-item" onClick={() => openAdd("Task")}>
                    <ListTodo size={16} /> Task
                  </button>
                )}
                {canCreateNote && (
                  <button type="button" className="gcal-create-menu-item" onClick={() => openAdd("Note")}>
                    <StickyNote size={16} /> Note
                  </button>
                )}
              </div>
            )}
          </div>

          <MiniCalendar
            monthDate={miniMonth}
            selectedDate={selectedDate}
            today={today}
            onChangeMonth={setMiniMonth}
            onSelectDate={(d) => {
              setSelectedDate(d);
              cal.setAnchorDate(d);
            }}
          />

          <CalendarFilterBar
            scope={scope}
            sites={sites}
            siteId={cal.siteId}
            onSiteChange={cal.setSiteId}
            favouritesOnly={cal.favouritesOnly}
            onFavouritesOnlyChange={cal.setFavouritesOnly}
            types={cal.types}
            onTypesChange={cal.setTypes}
          />
        </aside>

        <main className="gcal-main">
          {cal.view === "month" && (
            <CalendarMonthView
              monthDate={cal.anchorDate}
              items={cal.items}
              today={today}
              onDayClick={onGridDateClick}
              onItemClick={(item) => onItemClick(item)}
              onMoreClick={(d) => cal.setAnchorDate(d)}
              onPriorityChange={onPriorityChange}
            />
          )}
          {cal.view === "week" && (
            <CalendarWeekView
              anchorDate={cal.anchorDate}
              items={cal.items}
              today={today}
              onSlotClick={onGridDateClick}
              onItemClick={(item) => onItemClick(item)}
            />
          )}
          {cal.view === "day" && (
            <CalendarDayView
              anchorDate={cal.anchorDate}
              items={cal.items}
              today={today}
              onSlotClick={onGridDateClick}
              onItemClick={(item) => onItemClick(item)}
            />
          )}
        </main>
      </div>

      {popoverPos && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setPopoverPos(null)}
            style={{ position: "fixed", inset: 0, zIndex: 100, border: "none", background: "transparent", cursor: "default" }}
          />
          <div
            role="menu"
            aria-label="Create at this date"
            style={{
              position: "fixed",
              top: popoverPos.top,
              left: popoverPos.left,
              zIndex: 101,
              background: "var(--surface, #fff)",
              border: "1px solid var(--border, #e2e2e2)",
              borderRadius: "var(--r-sm, 8px)",
              boxShadow: "var(--sh, 0 4px 16px rgba(0,0,0,0.15))",
              padding: 4,
              minWidth: 200,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {pendingSeedDate && (
              <div style={{ padding: "8px 10px 4px", fontSize: 12, opacity: 0.6, fontWeight: 600 }}>
                {pendingSeedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => openAdd("Hearing")}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: 0, background: "transparent", font: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 4, cursor: "pointer" }}
            >
              <Gavel size={16} /> Hearing
            </button>
            {canCreateTask && (
              <button
                type="button"
                role="menuitem"
                onClick={() => openAdd("Task")}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: 0, background: "transparent", font: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 4, cursor: "pointer" }}
              >
                <ListTodo size={16} /> Task
              </button>
            )}
            {canCreateNote && (
              <button
                type="button"
                role="menuitem"
                onClick={() => openAdd("Note")}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", border: 0, background: "transparent", font: "inherit", fontSize: 13, padding: "8px 10px", borderRadius: 4, cursor: "pointer" }}
              >
                <StickyNote size={16} /> Note
              </button>
            )}
          </div>
        </>
      )}

      {/* Hearing "+Add" flow: pick a case first, then the full Hearing form */}
      {addKind === "Hearing" && !hearingCase && (
        <Dialog open title="Add Hearing" subtitle="Select the case for this hearing" icon={Gavel} onClose={closeAdd}>
          <Field label="Case" required>
            <CasePickerAutocomplete organizationId={organizationId} value={hearingCase} onSelect={setHearingCase} />
          </Field>
        </Dialog>
      )}
      {addKind === "Hearing" && hearingCase && (
        <HearingModal
          open
          onClose={closeAdd}
          onSubmit={handleSubmitHearing}
          title="Add Hearing"
          formData={hearingForm}
          onFormChange={(field, value) => setHearingForm((f) => ({ ...f, [field]: value }))}
          errors={{}}
          apiErrors={null}
          onSetApiErrors={() => undefined}
          isSubmitting={isSubmittingHearing}
          siteUsers={users}
        />
      )}

      <TaskModal
        open={addKind === "Task"}
        onClose={closeAdd}
        onSubmit={handleSubmitTask}
        organizationId={organizationId}
        sites={sites}
        users={users}
        isSubmitting={tasksHook.isSubmitting}
        existing={editingTask}
        onDelete={editingTask ? handleDeleteTask : undefined}
        seedDate={pendingSeedDate}
      />

      <NoteModal
        open={addKind === "Note"}
        onClose={closeAdd}
        onSubmit={handleSubmitNote}
        organizationId={organizationId}
        sites={sites}
        users={users}
        isSubmitting={notesHook.isSubmitting}
        existing={editingNote}
        onDelete={editingNote ? handleDeleteNote : undefined}
        seedDate={pendingSeedDate}
      />

      {remindersOpen && (
        <RemindersPanel organizationId={organizationId} onClose={() => setRemindersOpen(false)} />
      )}
    </div>
  );
}
