"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import RefreshIcon from "@mui/icons-material/Refresh";
import { SavedCasesTab } from "./components/SavedCasesTab";
import { HistoryTab } from "./components/HistoryTab";
import { SearchTab } from "./components/SearchTab";

export default function EcourtsLegacy({ orgId }: { orgId: string }) {

  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: 5 }, py: 3 }}>
      {/* Page header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          flexWrap: "wrap",
          gap: 1.5,
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.05) 100%)",
          borderRadius: "16px",
          p: "16px 20px",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <GavelIcon sx={{ color: "white", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              eCourts
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              Search, track, and manage court cases
            </Typography>
          </Box>
        </Box>

        {activeTab !== 0 && (
          <IconButton
            onClick={() => setRefreshKey((k) => k + 1)}
            size="small"
            sx={{
              border: "1px solid rgba(99,102,241,0.3)",
              borderRadius: "10px",
              color: "#6366f1",
              "&:hover": { background: "rgba(99,102,241,0.08)" },
            }}
            title="Refresh"
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Main card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "16px",
          background: "white",
          border: "1px solid rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            px: 2,
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              minHeight: 44,
            },
            "& .MuiTabs-indicator": { backgroundColor: "#6366f1" },
            "& .Mui-selected": { color: "#6366f1 !important" },
          }}
        >
          <Tab label="Search" />
          <Tab label="Saved Cases" />
          <Tab label="History" />
        </Tabs>

        {activeTab === 0 && <SearchTab organizationId={orgId} />}
        {activeTab === 1 && (
          <SavedCasesTab orgId={orgId} refreshKey={refreshKey} />
        )}
        {activeTab === 2 && (
          <HistoryTab orgId={orgId} refreshKey={refreshKey} />
        )}
      </Paper>
    </Box>
  );
}
