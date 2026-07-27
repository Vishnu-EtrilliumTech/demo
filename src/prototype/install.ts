/**
 * PROTOTYPE MOCK INSTALLER
 * ------------------------
 * Wires the mock router into every network path the app uses so the prototype
 * runs with ZERO backend:
 *   1. Patches the default axios instance + the shared apiClient adapter.
 *   2. Patches window.fetch (used by the Google-auth + register-org flows).
 *   3. Seeds a mock JWT + org session in localStorage so the app opens already
 *      signed in as the demo organisation admin.
 *
 * Imported for its side effects at the top of app/providers.tsx.
 */

import axios, { AxiosHeaders, type AxiosAdapter } from 'axios';
import apiClient from '@/services/httpServices';
import { resolveMock } from './router';
import * as db from './mockData';

let installed = false;

// ── base64url + mock JWT ───────────────────────────────────────────────────────
function b64url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const b64 = typeof btoa === 'function'
    ? btoa(unescape(encodeURIComponent(json)))
    : Buffer.from(json, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildMockJwt(): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: db.organization.currentUser.id,
    email: db.DEMO_EMAIL,
    // The /auth dispatcher reads the e-mail from this SAML-style claim.
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': db.DEMO_EMAIL,
    name: db.DEMO_NAME,
    role: 'organizationuser',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365, // 1 year
  };
  return `${b64url(header)}.${b64url(payload)}.mocksignature`;
}

// ── URL parsing ────────────────────────────────────────────────────────────────
interface Parsed { path: string; query: Record<string, string>; }

function parseUrl(rawUrl: string, baseURL?: string, params?: unknown): Parsed {
  let full = rawUrl || '';
  if (!/^https?:\/\//i.test(full)) {
    const base = (baseURL || 'http://prototype.local').replace(/\/$/, '');
    full = base + (full.startsWith('/') ? full : '/' + full);
  }
  let path = full;
  const query: Record<string, string> = {};
  try {
    const u = new URL(full);
    path = u.pathname;
    u.searchParams.forEach((v, k) => { query[k] = v; });
  } catch {
    const qIdx = full.indexOf('?');
    path = qIdx >= 0 ? full.slice(0, qIdx) : full;
    path = path.replace(/^https?:\/\/[^/]+/i, '');
  }
  // Merge axios `params` object.
  if (params && typeof params === 'object') {
    for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
      if (v !== undefined && v !== null) query[k] = String(v);
    }
  }
  return { path, query };
}

// ── axios adapter ────────────────────────────────────────────────────────────
const mockAdapter: AxiosAdapter = (config) =>
  new Promise((resolve, reject) => {
    const { path, query } = parseUrl(config.url ?? '', config.baseURL, config.params);
    const method = (config.method ?? 'get').toUpperCase();

    // Binary downloads → hand back an empty blob so callers get a valid file.
    if (config.responseType === 'blob') {
      const blob = typeof Blob !== 'undefined' ? new Blob([], { type: 'application/pdf' }) : new Uint8Array();
      resolve({ data: blob as unknown, status: 200, statusText: 'OK', headers: {}, config, request: {} });
      return;
    }

    const { status, body } = resolveMock(method, path, query, config.data);
    const response = {
      data: body,
      status,
      statusText: status < 400 ? 'OK' : 'Error',
      headers: new AxiosHeaders(),
      config,
      request: {},
    };
    const validate = config.validateStatus ?? ((s: number) => s >= 200 && s < 300);
    if (validate(status)) {
      resolve(response);
    } else {
      const err = new axios.AxiosError(
        `Request failed with status code ${status}`,
        status >= 500 ? 'ERR_BAD_RESPONSE' : 'ERR_BAD_REQUEST',
        config,
        {},
        response as never,
      );
      reject(err);
    }
  });

// ── fetch patch ────────────────────────────────────────────────────────────────
function patchFetch() {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
  const original = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
    if (url && /\/api\//.test(url)) {
      const method = (init?.method ?? (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).method : 'GET')) || 'GET';
      const { path, query } = parseUrl(url);
      const { status, body } = resolveMock(method, path, query, init?.body);
      return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return original(input, init);
  };
}

// ── seed logged-in session ─────────────────────────────────────────────────────
function seedSession(token: string) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const ls = window.localStorage;
  if (!ls.getItem('lawsome_token')) {
    ls.setItem('lawsome_token', token);
    ls.setItem('role', 'organizationuser');
    ls.setItem('orgData', JSON.stringify(db.organization));
    ls.setItem('currentUser', JSON.stringify(db.organization.currentUser));
    ls.setItem('userName', db.DEMO_NAME);
  }
}

export function installMocks(): void {
  if (installed) return;
  installed = true;

  const token = buildMockJwt();
  (globalThis as { __MOCK_JWT__?: string }).__MOCK_JWT__ = token;

  axios.defaults.adapter = mockAdapter;
  apiClient.defaults.adapter = mockAdapter;

  patchFetch();
  seedSession(token);
}

// Run on import (covers both server render and client hydration for axios;
// fetch/localStorage patches are guarded to the browser).
installMocks();
