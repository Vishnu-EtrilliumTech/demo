/**
 * PROTOTYPE MOCK ROUTER
 * ---------------------
 * Pure function that maps an HTTP method + URL pathname to a canned response.
 * Used by both the axios adapter and the patched `fetch` (see install.ts).
 *
 * Response envelope matches the real backend: `{ data, errors, meta }`.
 * List endpoints put a `PagedResponse<T>` in `data`; single endpoints put the
 * entity. Anything not explicitly matched falls through to a sensible generic
 * response so no screen ever hits a real network or throws on a missing route.
 */

import * as db from './mockData';
import type {
  Priority,
  Note,
  OrgTask,
  CalendarItem,
  CalendarItemType,
  HearingCalendarItem,
  TaskCalendarItem,
  NoteCalendarItem,
} from '@/app/organization/types/calendarTypes';
import type { HearingStatus, TaskStatus } from '@/app/organization/types/caseindex';

export interface MockResult {
  status: number;
  body: unknown;
}

type Q = Record<string, string>;

const env = (data: unknown) => ({ data, errors: [], meta: {} });
const paged = (items: unknown[], q: Q) => env(db.page(items, q));
const nowIso = () => new Date().toISOString();
const genId = () => String(Date.now() % 100000000);

/** Parse a JSON-ish body (string or object) into a plain object. */
function parseBody(body: unknown): Record<string, unknown> {
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch { return {}; }
  }
  if (typeof body === 'object') return body as Record<string, unknown>;
  return {};
}

/** `:name` → capture group; returns RegExpMatchArray or null. */
function match(path: string, pattern: string): RegExpMatchArray | null {
  const rx = new RegExp('^' + pattern.replace(/:[^/]+/g, '([^/]+)') + '$');
  return path.match(rx);
}

/** Builds the merged Hearing+Task+Note feed for `GET /organizations/:orgId/calendar`. */
function buildCalendarFeed(organizationId: string, query: Q): CalendarItem[] {
  const currentUserId = '201'; // single demo user in this prototype (see mockData.ts DEMO_NAME)
  const from = query.from ? new Date(query.from).getTime() : -Infinity;
  const to = query.to ? new Date(query.to).getTime() : Infinity;
  const siteId = query.siteId || undefined;
  const favouritesOnly = query.favouritesOnly === 'true';
  const requestedTypes = query.types ? (query.types.split(',') as CalendarItemType[]) : null;
  const types = requestedTypes ?? db.organization.defaultCalendarItemTypes ?? (['Hearing', 'Task', 'Note'] as CalendarItemType[]);

  const favouriteCaseIds = new Set(db.caseFavourites.filter((f) => f.userId === currentUserId).map((f) => f.caseId));
  const caseTitleOf = (caseId: string | null) => (caseId ? db.cases.find((c) => c.id === caseId)?.title ?? null : null);
  const inRange = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    const t = new Date(dateStr).getTime();
    return t >= from && t <= to;
  };
  const inSite = (itemSiteId: string | null) => !siteId || itemSiteId === siteId;
  const passesFavourites = (caseId: string | null) => !favouritesOnly || (caseId !== null && favouriteCaseIds.has(caseId));

  const items: CalendarItem[] = [];

  if (types.includes('Hearing')) {
    db.hearings
      .filter((h) => inRange(h.hearingDateTime) && inSite(h.siteId) && passesFavourites(h.caseId))
      .forEach((h) => {
        items.push({
          id: h.id,
          itemType: 'Hearing',
          date: h.hearingDateTime,
          title: `Hearing — ${h.caseName ?? h.caseId}`,
          priority: h.priority ?? null,
          organizationId,
          siteId: h.siteId,
          caseId: h.caseId,
          caseTitle: caseTitleOf(h.caseId),
          isFavouriteCase: favouriteCaseIds.has(h.caseId),
          createdById: h.createdById,
          status: (h.hearingStatus ?? h.status ?? 'Scheduled') as unknown as HearingStatus,
        } as HearingCalendarItem);
      });
  }

  if (types.includes('Task')) {
    // Case-scoped tasks (existing `tasks` table)
    db.tasks
      .filter((t) => inRange(t.dueDate) && inSite(String(t.siteId)) && passesFavourites(t.caseId) &&
        (t.assignedToId === Number(currentUserId) || t.createdById === Number(currentUserId)))
      .forEach((t) => {
        items.push({
          id: t.id,
          itemType: 'Task',
          date: t.dueDate,
          title: t.title,
          priority: t.priority ?? null,
          organizationId,
          siteId: String(t.siteId),
          caseId: t.caseId,
          caseTitle: caseTitleOf(t.caseId),
          isFavouriteCase: favouriteCaseIds.has(t.caseId),
          createdById: String(t.createdById),
          status: t.status as unknown as TaskStatus,
          assignedToId: String(t.assignedToId),
        } as TaskCalendarItem);
      });
    // Org/Site-scope tasks
    db.orgTasks
      .filter((t) => inRange(t.dueDate) && inSite(t.siteId) && passesFavourites(t.caseId) &&
        (t.assignedToId === currentUserId || t.createdById === currentUserId))
      .forEach((t) => {
        items.push({
          id: t.id,
          itemType: 'Task',
          date: t.dueDate ?? '',
          title: t.title,
          priority: t.priority ?? null,
          organizationId,
          siteId: t.siteId,
          caseId: t.caseId,
          caseTitle: caseTitleOf(t.caseId),
          isFavouriteCase: t.caseId ? favouriteCaseIds.has(t.caseId) : false,
          createdById: t.createdById,
          status: t.status,
          assignedToId: t.assignedToId,
        } as TaskCalendarItem);
      });
  }

  if (types.includes('Note')) {
    db.notes
      .filter((n) => inRange(n.noteDate) && inSite(n.siteId) && passesFavourites(n.caseId) &&
        (n.createdById === currentUserId || n.taggedUserIds.includes(currentUserId)))
      .forEach((n) => {
        items.push({
          id: n.id,
          itemType: 'Note',
          date: n.noteDate,
          title: n.title,
          priority: n.priority ?? null,
          organizationId,
          siteId: n.siteId,
          caseId: n.caseId,
          caseTitle: caseTitleOf(n.caseId),
          isFavouriteCase: n.caseId ? favouriteCaseIds.has(n.caseId) : false,
          createdById: n.createdById,
          taggedUserIds: n.taggedUserIds,
        } as NoteCalendarItem);
      });
  }

  return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/** Applies isFavourite decoration + favouritesOnly/includeArchived filters to a case list (§4.6/§4.7). */
function decorateAndFilterCases(cases: typeof db.cases, query: Q): typeof db.cases {
  const currentUserId = '201';
  const includeArchived = query.includeArchived === 'true';
  const favouritesOnly = query.favouritesOnly === 'true';
  return cases
    .map((c) => ({ ...c, isFavourite: db.isCaseFavourite(currentUserId, c.id) }))
    .filter((c) => includeArchived || !c.archivedDate)
    .filter((c) => !favouritesOnly || c.isFavourite);
}

export function resolveMock(
  methodRaw: string,
  path: string,
  query: Q = {},
  bodyRaw?: unknown,
): MockResult {
  const method = methodRaw.toUpperCase();
  const body = parseBody(bodyRaw);
  const G = '/api/v1/organizations';
  const ok = (data: unknown, status = 200): MockResult => ({ status, body: env(data) });
  const list = (items: unknown[], status = 200): MockResult => ({ status, body: paged(items, query) });

  // ── Auth ─────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/api/auth/google') return ok({ token: (globalThis as { __MOCK_JWT__?: string }).__MOCK_JWT__ ?? '' });
  if (method === 'POST' && path === '/api/auth/register-organization') return ok({ organizationId: db.ORG_ID }, 201);

  // ── Current user ───────────────────────────────────────────────────────────
  if (method === 'GET' && path === '/api/v1/users/me') return ok(db.users[0]);

  // ── Client / legal-expert lookups (used by /auth dispatcher) ───────────────
  if (method === 'GET' && match(path, '/api/v1/clients/email/:email')) return ok(db.clientProfile);
  if (method === 'GET' && match(path, '/api/v1/legalexperts/email/:email')) return ok(db.legalExpertProfile);
  if (method === 'GET' && match(path, '/api/v1/legalexperts/:id/registrationstage')) return ok({ stage: 'Schedule' });
  if (method === 'GET' && match(path, '/api/v1/legalexperts/:id/cases')) return list(db.legalExpertCases);
  if (method === 'GET' && match(path, '/api/v1/legalexperts/:id/communications')) return list(db.legalExpertCommunications);
  if (method === 'GET' && path === '/api/v1/legalexperts/types') return ok(db.expertTypes);
  if (method === 'POST' && path === '/api/v1/legalexperts/search/basic') return ok(db.legalExpertSearchResults);
  if (method === 'GET' && path === '/api/v1/legalexperts/appointment-count') return list(db.legalExperts);
  if (method === 'GET' && match(path, '/api/v1/legalexperts/approved/:status')) return list(db.legalExperts);
  if (method === 'GET' && path === '/api/v1/legalexperts') return list(db.legalExperts);

  // ── Admin: clients / appointments / orders / settlements / ratings ─────────
  if (method === 'GET' && path === '/api/v1/clients') return list(db.clients);
  if (method === 'GET' && (path === '/api/v1/appointments/pending' || path === '/api/v1/appointments/past')) return list(db.appointments);
  if (method === 'GET' && match(path, '/api/v1/appointments/legalexperts/:id/:scope')) return list(db.appointments);
  if (method === 'GET' && match(path, '/api/v1/appointments/clients/:id/:scope')) return list(db.appointments);
  if (method === 'GET' && match(path, '/api/v1/orders/legalexperts/:id')) return list(db.payments);
  if (method === 'GET' && match(path, '/api/v1/orders/clients/:id')) return list(db.payments);
  if (method === 'GET' && match(path, '/api/v1/paymentsettlements/legalexperts/:id')) return list(db.payments);
  if (method === 'GET' && match(path, '/api/v1/ratings/legalexperts/:id')) return list(db.ratings);

  // ── Contact ─────────────────────────────────────────────────────────────────
  if (method === 'POST' && path === '/api/v1/contact') return ok({ submitted: true });

  // ── Client user service (baseURL + /users/...) ────────────────────────────
  if (method === 'GET' && match(path, '/users/:email')) return ok(db.clientProfile);
  if (method === 'POST' && path === '/users/register') return ok(db.clientProfile, 201);

  // ── eCourts: states / districts / complexes / courts / court-locations ─────
  if (method === 'GET' && path === '/api/v1/ecourts/states') return ok(db.courtStates);
  {
    const md = match(path, '/api/v1/ecourts/states/:code/districts');
    if (method === 'GET' && md) return ok(db.courtDistricts[decodeURIComponent(md[1])] ?? []);
  }
  {
    const mc = match(path, '/api/v1/ecourts/districts/:code/complexes');
    if (method === 'GET' && mc) return ok(db.courtComplexes[decodeURIComponent(mc[1])] ?? []);
  }
  {
    const mco = match(path, '/api/v1/ecourts/complexes/:code/courts');
    if (method === 'GET' && mco) return ok(db.courts[decodeURIComponent(mco[1])] ?? []);
  }
  if (method === 'GET' && path === '/api/v1/court-locations') {
    const search = (query.search ?? '').toLowerCase();
    const items = search ? db.courtLocations.filter((c) => c.display.toLowerCase().includes(search)) : db.courtLocations;
    return list(items);
  }

  // ── Organization root ──────────────────────────────────────────────────────
  if (method === 'GET' && match(path, `${G}/users/:email`)) return ok(db.organization);
  if (method === 'POST' && path === G) return ok({ id: db.ORG_ID }, 201);
  if (method === 'GET' && match(path, `${G}/keys/:key/availability`)) return ok({ isAvailable: true });

  // Everything below is org-scoped: /api/v1/organizations/:orgId/...
  const orgMatch = path.match(new RegExp(`^${G}/([^/]+)(/.*)?$`));
  if (orgMatch) {
    const sub = orgMatch[2] ?? ''; // begins with '/' or ''

    // site-key availability
    if (method === 'GET' && match(sub, '/sites/keys/:key/availability')) return ok({ isAvailable: true });

    // ── eCourts (org-scoped) ────────────────────────────────────────────────
    if (method === 'GET' && sub === '/ecourts/search') return list(db.buildEcourtSearchResults(query));
    if (method === 'GET' && sub === '/ecourts/quota') return ok(db.ecourtsQuota);
    if (method === 'GET' && sub === '/ecourts/search-history') return list(db.searchHistory);
    if (method === 'GET' && sub === '/courtdata/persisted') return list(db.persistedEcourtCases);
    if (method === 'DELETE' && sub === '/courtdata/persisted') {
      const cnrs = (body.cnrNumbers as string[]) ?? [];
      return ok({ success: true, message: 'Deleted', deletedCount: cnrs.length, failedCount: 0, results: cnrs.map((c) => ({ cnrNumber: c, status: 'Deleted', message: null })) });
    }
    if (method === 'PUT' && match(sub, '/courtdata/persisted/:cnr/remarks')) return ok({ success: true, message: 'Updated', remarks: (body.remarks as string) ?? null });
    if (method === 'GET' && sub === '/cases/unlinked') return list(db.unlinkedCases);
    {
      const mc = match(sub, '/cnr/:cnr/courtdata') || match(sub, '/cnr/:cnr/courtdata/case');
      if (method === 'GET' && mc) return ok(db.buildCourtData(decodeURIComponent(mc[1])));
      const mp = match(sub, '/cnr/:cnr/courtdata');
      if (method === 'PUT' && mp) return ok(db.buildCourtData(decodeURIComponent(mp[1])));
      if (method === 'PUT' && match(sub, '/cnr/:cnr/courtdata/retain')) return ok({ message: 'Retained' });
    }

    // ── Users ──────────────────────────────────────────────────────────────
    if (method === 'GET' && sub === '/users') return list(db.users);
    {
      const mu = match(sub, '/users/:uid/basic');
      if (method === 'GET' && mu) {
        const u = db.users.find((x) => x.id === mu[1]);
        return ok({ id: mu[1], fullName: u?.fullName ?? 'Unknown User' });
      }
    }
    if (method === 'GET' && match(sub, '/users/:uid/cases/summary')) {
      return ok({ cases: db.cases, caseTasks: db.tasks, caseHearings: db.hearings });
    }
    {
      const mu = match(sub, '/users/:uid');
      if (mu && method === 'GET') return ok(db.users.find((x) => x.id === mu[1]) ?? db.users[0]);
      if (mu && method === 'PUT') return ok({ ...db.users.find((x) => x.id === mu[1]), ...body });
      if (mu && method === 'DELETE') return { status: 204, body: env(null) };
    }
    if (method === 'POST' && sub === '/users') return ok({ id: genId(), ...body, enabled: true }, 201);

    // ── Sites ──────────────────────────────────────────────────────────────
    if (method === 'GET' && match(sub, '/sites/users/:uid')) return list(db.sites);
    if (method === 'GET' && sub === '/sites') return list(db.sites);
    if (method === 'POST' && sub === '/sites') return ok({ id: genId(), ...body, organizationId: orgMatch[1] }, 201);
    if (method === 'GET' && match(sub, '/sites/:sid/users/:uid')) {
      const mm = match(sub, '/sites/:sid/users/:uid')!;
      return ok(db.users.find((x) => x.id === mm[2]) ?? db.users[0]);
    }
    if (method === 'GET' && match(sub, '/sites/:sid/users')) return list(db.users.filter((u) => u.siteId === match(sub, '/sites/:sid/users')![1]));
    if (method === 'POST' && match(sub, '/sites/:sid/users')) return ok({ id: genId(), ...body, enabled: true }, 201);
    if (method === 'PUT' && match(sub, '/sites/:sid/users/:uid')) return ok({ ...body });
    if (method === 'DELETE' && match(sub, '/sites/:sid/users/:uid')) return { status: 204, body: env(null) };
    if (method === 'GET' && match(sub, '/sites/:sid/hearings')) return list(db.hearings);

    // ── Cases (site-scoped) ──────────────────────────────────────────────────
    if (method === 'GET' && match(sub, '/sites/:sid/cases')) {
      const sid = match(sub, '/sites/:sid/cases')![1];
      return list(decorateAndFilterCases(db.cases.filter((c) => c.siteId === sid), query));
    }
    if (method === 'POST' && match(sub, '/sites/:sid/cases')) return ok({ id: genId(), status: 'Open', createdAt: nowIso(), ...body }, 201);

    // case sub-resources: /sites/:sid/cases/:cid  (with optional trailing path)
    const caseBase = sub.match(/^\/sites\/[^/]+\/cases\/[^/]+(\/.*)?$/);
    if (caseBase) {
      const rest = caseBase[1] ?? '';
      const cid = sub.split('/')[4];

      if (rest === '') {
        if (method === 'GET') return ok({ ...(db.cases.find((c) => c.id === cid) ?? db.cases[0]) });
        if (method === 'PUT') return ok({ ...(db.cases.find((c) => c.id === cid) ?? db.cases[0]), ...body });
        if (method === 'DELETE') return { status: 204, body: env(null) };
      }

      // ── Case Favourites (per current user, mock user id '201') ────────────
      if (method === 'PUT' && rest === '/favourite') {
        if (!db.isCaseFavourite('201', cid)) db.caseFavourites.push({ userId: '201', caseId: cid, createdDate: nowIso() });
        return ok({ isFavourite: true });
      }
      if (method === 'DELETE' && rest === '/favourite') {
        const idx = db.caseFavourites.findIndex((f) => f.userId === '201' && f.caseId === cid);
        if (idx >= 0) db.caseFavourites.splice(idx, 1);
        return { status: 204, body: env(null) };
      }

      // ── Case Archive ───────────────────────────────────────────────────────
      if (method === 'PUT' && rest === '/archive') {
        const c = db.cases.find((x) => x.id === cid);
        if (c) c.archivedDate = nowIso();
        return ok({ archivedDate: c?.archivedDate ?? null });
      }
      if (method === 'PUT' && rest === '/unarchive') {
        const c = db.cases.find((x) => x.id === cid);
        if (c) c.archivedDate = null;
        return ok({ archivedDate: null });
      }

      // ── Priority quick-set (Hearing / case-scoped Task) ─────────────────────
      {
        const mh = match(rest, '/hearings/:hid/priority');
        if (method === 'PUT' && mh) {
          const h = db.hearings.find((x) => x.id === mh[1]);
          if (h) h.priority = (body.priority as Priority) ?? null;
          return ok({ priority: h?.priority ?? null });
        }
        const mt = match(rest, '/tasks/:tid/priority');
        if (method === 'PUT' && mt) {
          const t = db.tasks.find((x) => x.id === mt[1]);
          if (t) t.priority = (body.priority as Priority) ?? null;
          return ok({ priority: t?.priority ?? null });
        }
      }

      // summary / chat (AI)
      if (method === 'GET' && rest === '/summary') {
        const c = db.cases.find((x) => x.id === cid) ?? db.cases[0];
        return ok({ caseId: Number(cid), caseTitle: c.title, caseNumber: c.caseNumber, summary: `AI summary (prototype): ${c.title}. This matter is currently ${c.status}. Next steps involve reviewing filed documents and preparing for the upcoming hearing.`, generatedAt: nowIso() });
      }
      if (method === 'POST' && rest === '/chat') return ok({ response: 'This is a prototype AI response. In the full product this would be generated from the case record.', timestamp: nowIso() });

      // collections under a case
      const listMap: Record<string, unknown[]> = {
        '/tasks': db.tasks.filter((t) => t.caseId === cid),
        '/documents': db.documents.filter((d) => d.caseId === cid),
        '/hearings': db.hearings.filter((h) => h.caseId === cid),
        '/comments': db.comments.filter((c) => c.caseId === cid),
        '/invoices': db.invoices.filter((i) => i.caseId === cid),
        '/caseclients': db.caseClients.filter((c) => c.caseId === cid),
        '/contributors': db.contributors,
        '/referencecases': db.referenceCases,
      };
      if (method === 'GET' && rest in listMap) return list(listMap[rest]);
      if (method === 'GET' && rest === '/contributors/available-users') return list(db.users);
      if (method === 'GET' && match(rest, '/tasks/assignee/:uid')) return list(db.tasks);

      // invoice single
      {
        const mi = match(rest, '/invoices/:iid');
        if (mi && method === 'GET') return ok(db.invoices.find((x) => x.id === mi[1]) ?? db.invoices[0]);
      }

      // POST create under case
      if (method === 'POST' && rest in listMap) return ok({ id: genId(), caseId: cid, createdDate: nowIso(), ...body }, 201);
      if (method === 'POST') return ok({ id: genId(), caseId: cid, ...body }, 201);
      if (method === 'PUT') return ok({ id: genId(), ...body });
      if (method === 'DELETE') return { status: 204, body: env(null) };
    }

    // link court data
    if (method === 'PUT' && match(sub, '/sites/:sid/cases/:cid/cnr/:cnr/linkcourtdata')) return ok({ linked: true });

    // ── Cases / Hearings (org-scoped) ─────────────────────────────────────────
    if (method === 'GET' && sub === '/cases') return list(decorateAndFilterCases(db.cases, query));
    if (method === 'GET' && sub === '/hearings') return list(db.hearings);

    // ── Unified Calendar feed ────────────────────────────────────────────────
    if (method === 'GET' && sub === '/calendar') return ok(buildCalendarFeed(orgMatch[1], query));

    // ── Notes CRUD (Org scope) ───────────────────────────────────────────────
    if (method === 'GET' && sub === '/notes') return list(db.notes.filter((n) => !n.siteId));
    if (method === 'POST' && sub === '/notes') {
      const n: Note = { id: genId(), organizationId: orgMatch[1], siteId: null, caseId: (body.caseId as string) ?? null, title: body.title as string, body: (body.body as string) ?? null, noteDate: body.noteDate as string, priority: (body.priority as Priority) ?? null, taggedUserIds: (body.taggedUserIds as string[]) ?? [], createdById: '201', createdDate: nowIso(), updatedDate: nowIso() };
      db.notes.push(n);
      return ok(n, 201);
    }
    {
      const mp = match(sub, '/notes/:nid/priority');
      if (method === 'PUT' && mp) {
        const n = db.notes.find((x) => x.id === mp[1]);
        if (n) n.priority = (body.priority as Priority) ?? null;
        return ok({ priority: n?.priority ?? null });
      }
      const mn = match(sub, '/notes/:nid');
      if (mn && method === 'GET') return ok(db.notes.find((x) => x.id === mn[1]) ?? null);
      if (mn && method === 'PUT') {
        const n = db.notes.find((x) => x.id === mn[1]);
        if (n) Object.assign(n, body, { updatedDate: nowIso() });
        return ok(n ?? { id: mn[1], ...body });
      }
      if (mn && method === 'DELETE') {
        const idx = db.notes.findIndex((x) => x.id === mn[1]);
        if (idx >= 0) db.notes.splice(idx, 1);
        return { status: 204, body: env(null) };
      }
    }

    // ── Notes CRUD (Site scope) ──────────────────────────────────────────────
    {
      const ms = match(sub, '/sites/:sid/notes');
      if (method === 'GET' && ms) return list(db.notes.filter((n) => n.siteId === ms[1]));
      if (method === 'POST' && ms) {
        const n: Note = { id: genId(), organizationId: orgMatch[1], siteId: ms[1], caseId: (body.caseId as string) ?? null, title: body.title as string, body: (body.body as string) ?? null, noteDate: body.noteDate as string, priority: (body.priority as Priority) ?? null, taggedUserIds: (body.taggedUserIds as string[]) ?? [], createdById: '201', createdDate: nowIso(), updatedDate: nowIso() };
        db.notes.push(n);
        return ok(n, 201);
      }
      const mp = match(sub, '/sites/:sid/notes/:nid/priority');
      if (method === 'PUT' && mp) {
        const n = db.notes.find((x) => x.id === mp[2]);
        if (n) n.priority = (body.priority as Priority) ?? null;
        return ok({ priority: n?.priority ?? null });
      }
      const mn = match(sub, '/sites/:sid/notes/:nid');
      if (mn && method === 'GET') return ok(db.notes.find((x) => x.id === mn[2]) ?? null);
      if (mn && method === 'PUT') {
        const n = db.notes.find((x) => x.id === mn[2]);
        if (n) Object.assign(n, body, { updatedDate: nowIso() });
        return ok(n ?? { id: mn[2], ...body });
      }
      if (mn && method === 'DELETE') {
        const idx = db.notes.findIndex((x) => x.id === mn[2]);
        if (idx >= 0) db.notes.splice(idx, 1);
        return { status: 204, body: env(null) };
      }
    }

    // ── Org/Site-scope Tasks CRUD (unified `tasks` concept, Calendar-originated) ─
    if (method === 'GET' && sub === '/tasks') return list(db.orgTasks.filter((t) => !t.siteId));
    if (method === 'POST' && sub === '/tasks') {
      const t: OrgTask = { id: genId(), organizationId: orgMatch[1], siteId: null, caseId: (body.caseId as string) ?? null, title: body.title as string, description: (body.description as string) ?? null, dueDate: (body.dueDate as string) ?? null, status: body.status as OrgTask['status'], assignedToId: (body.assignedToId as string) ?? null, priority: (body.priority as Priority) ?? null, createdById: '201' };
      db.orgTasks.push(t);
      return ok(t, 201);
    }
    {
      const mp = match(sub, '/tasks/:tid/priority');
      if (method === 'PUT' && mp) {
        const t = db.orgTasks.find((x) => x.id === mp[1]);
        if (t) t.priority = (body.priority as Priority) ?? null;
        return ok({ priority: t?.priority ?? null });
      }
      const mt = match(sub, '/tasks/:tid');
      if (mt && method === 'GET') return ok(db.orgTasks.find((x) => x.id === mt[1]) ?? null);
      if (mt && method === 'PUT') {
        const t = db.orgTasks.find((x) => x.id === mt[1]);
        if (t) Object.assign(t, body);
        return ok(t ?? { id: mt[1], ...body });
      }
      if (mt && method === 'DELETE') {
        const idx = db.orgTasks.findIndex((x) => x.id === mt[1]);
        if (idx >= 0) db.orgTasks.splice(idx, 1);
        return { status: 204, body: env(null) };
      }
    }
    {
      const ms = match(sub, '/sites/:sid/tasks');
      if (method === 'GET' && ms) return list(db.orgTasks.filter((t) => t.siteId === ms[1]));
      if (method === 'POST' && ms) {
        const t: OrgTask = { id: genId(), organizationId: orgMatch[1], siteId: ms[1], caseId: (body.caseId as string) ?? null, title: body.title as string, description: (body.description as string) ?? null, dueDate: (body.dueDate as string) ?? null, status: body.status as OrgTask['status'], assignedToId: (body.assignedToId as string) ?? null, priority: (body.priority as Priority) ?? null, createdById: '201' };
        db.orgTasks.push(t);
        return ok(t, 201);
      }
      const mp = match(sub, '/sites/:sid/tasks/:tid/priority');
      if (method === 'PUT' && mp) {
        const t = db.orgTasks.find((x) => x.id === mp[2]);
        if (t) t.priority = (body.priority as Priority) ?? null;
        return ok({ priority: t?.priority ?? null });
      }
      const mt = match(sub, '/sites/:sid/tasks/:tid');
      if (mt && method === 'GET') return ok(db.orgTasks.find((x) => x.id === mt[2]) ?? null);
      if (mt && method === 'PUT') {
        const t = db.orgTasks.find((x) => x.id === mt[2]);
        if (t) Object.assign(t, body);
        return ok(t ?? { id: mt[2], ...body });
      }
      if (mt && method === 'DELETE') {
        const idx = db.orgTasks.findIndex((x) => x.id === mt[2]);
        if (idx >= 0) db.orgTasks.splice(idx, 1);
        return { status: 204, body: env(null) };
      }
    }

    // ── eCourts onboarding bulk import ───────────────────────────────────────
    {
      const mi = match(sub, '/sites/:sid/ecourts/import');
      if (method === 'POST' && mi) {
        const cnrNumbers = (body.cnrNumbers as string[]) ?? [];
        return ok({ results: db.importEcourtsCases(mi[1], cnrNumbers) }, 201);
      }
    }

    // ── Single org GET / mutations ────────────────────────────────────────────
    if (sub === '') {
      if (method === 'GET') return ok(db.organization);
      if (method === 'PUT') {
        if ('defaultCalendarItemTypes' in body) db.organization.defaultCalendarItemTypes = body.defaultCalendarItemTypes as CalendarItemType[] | null;
        return ok({ ...db.organization, ...body });
      }
      if (method === 'DELETE') return { status: 204, body: env(null) };
    }
  }

  // ── Generic fallback ─────────────────────────────────────────────────────────
  if (method === 'DELETE') return { status: 204, body: env(null) };
  if (method === 'POST') return ok({ id: genId(), ...body }, 201);
  if (method === 'PUT') return ok({ id: genId(), ...body });
  // Unknown GET: return an empty object (normalizePage degrades to an empty page).
  return ok({});
}
