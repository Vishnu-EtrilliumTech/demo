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
      return list(db.cases.filter((c) => c.siteId === sid));
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
    if (method === 'GET' && sub === '/cases') return list(db.cases);
    if (method === 'GET' && sub === '/hearings') return list(db.hearings);

    // ── Single org GET / mutations ────────────────────────────────────────────
    if (sub === '') {
      if (method === 'GET') return ok(db.organization);
      if (method === 'PUT') return ok({ ...db.organization, ...body });
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
