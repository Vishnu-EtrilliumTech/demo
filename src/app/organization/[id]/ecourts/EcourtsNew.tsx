"use client";

import React, { useState } from "react";
import { Landmark, Search, Bookmark, History, RefreshCw } from "lucide-react";
import { LuiRoot, Button, Tabs, type TabItem } from "@/design-system";
import { SearchTabNew } from "./components/SearchTabNew";
import { SavedCasesTabNew } from "./components/SavedCasesTabNew";
import { HistoryTabNew } from "./components/HistoryTabNew";

const TABS: TabItem[] = [
  { key: "search", label: "Search", icon: Search },
  { key: "saved", label: "Saved Cases", icon: Bookmark },
  { key: "history", label: "History", icon: History },
];

/**
 * DS eCourts hub (contract §J): Search / Saved Cases / History. Reuses the
 * eCourts service layer; the Refresh action re-fetches the non-Search tabs.
 */
export default function EcourtsNew({ orgId }: { orgId: string }) {
  const [tab, setTab] = useState("search");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <LuiRoot>
      <div className="sheet">
        <div className="page-head">
          <div className="ph-lead">
            <div className="eyebrow">
              <Landmark aria-hidden /> eCourts
            </div>
            <h1>eCourts</h1>
            <div className="sub">Search, track, and manage court cases.</div>
          </div>
          {tab !== "search" && (
            <div className="ph-actions">
              <Button variant="secondary" icon={RefreshCw} onClick={() => setRefreshKey((k) => k + 1)}>
                Refresh
              </Button>
            </div>
          )}
        </div>

        <Tabs items={TABS} activeKey={tab} onChange={setTab} />

        {tab === "search" && <SearchTabNew organizationId={orgId} />}
        {tab === "saved" && <SavedCasesTabNew orgId={orgId} refreshKey={refreshKey} />}
        {tab === "history" && <HistoryTabNew orgId={orgId} refreshKey={refreshKey} />}
      </div>
    </LuiRoot>
  );
}
