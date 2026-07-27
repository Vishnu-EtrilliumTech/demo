"use client";

import React, { use } from "react";
import { useFeatureFlag } from "@/design-system";
import LawyersLegacy from "./LawyersLegacy";
import LawyersNew from "./LawyersNew";

/**
 * Lawyers (Users) screen. Gated on the `lawyers` flag: DS screen when on, legacy
 * MUI screen when off (clean per-screen rollback, REVAMP_SPEC §3).
 */
export default function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id: orgId } = use(params);
  const raw = use(searchParams).viewSiteId;
  const viewSiteId = Array.isArray(raw) ? raw[0] : raw;
  const on = useFeatureFlag("lawyers");
  return on ? <LawyersNew orgId={orgId} viewSiteId={viewSiteId} /> : <LawyersLegacy orgId={orgId} viewSiteId={viewSiteId} />;
}
