"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LinkIcon from "@mui/icons-material/Link";
import {
  fetchPersistedEcourtCases,
  fetchUnlinkedCases,
  linkCnrCourtData,
} from "@/app/organization/services/ecourtapi";
import { UnlinkedCase } from "@/app/organization/types/ecourtTypes";
import { useToast } from "@/contexts/ToastContext";

interface LinkCaseButtonProps {
  orgId: string;
  cnrNumber: string;
  label?: string;
  onLinked?: () => void;
  /** Skip the already-linked lookup when the caller already knows this CNR is unlinked. */
  skipLinkedCheck?: boolean;
}

export function LinkCaseButton({
  orgId,
  cnrNumber,
  label = "Link to Case",
  onLinked,
  skipLinkedCheck = false,
}: LinkCaseButtonProps) {
  const { showSuccess, showError } = useToast();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [cases, setCases] = useState<UnlinkedCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alreadyLinked, setAlreadyLinked] = useState(false);
  const [checkingLinked, setCheckingLinked] = useState(!skipLinkedCheck);

  useEffect(() => {
    if (skipLinkedCheck) return;
    let cancelled = false;
    setCheckingLinked(true);
    fetchPersistedEcourtCases(orgId, { cnr: cnrNumber, pageSize: 1 })
      .then((page) => {
        if (cancelled) return;
        const match = page.items.find((c) => c.cnrNumber === cnrNumber);
        setAlreadyLinked(Boolean(match?.linkedCaseDetails.length));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCheckingLinked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orgId, cnrNumber, skipLinkedCheck]);

  const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
    setSearch("");
    setCases([]);
    setLoading(true);
    try {
      const result = await fetchUnlinkedCases(orgId);
      setCases(result.items);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load cases");
      setAnchor(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setAnchor(null);

  const handleSelect = async (c: UnlinkedCase) => {
    setAnchor(null);
    try {
      await linkCnrCourtData(orgId, c.siteId, String(c.id), cnrNumber);
      showSuccess(`${cnrNumber} is successfully linked with ${c.title}`);
      setAlreadyLinked(true);
      onLinked?.();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to link case");
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!search.trim()) return true;
    const t = search.toLowerCase();
    return c.caseNumber.toLowerCase().includes(t) || c.title.toLowerCase().includes(t);
  });

  if (!skipLinkedCheck && (checkingLinked || alreadyLinked)) return null;

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        startIcon={<LinkIcon sx={{ fontSize: "14px !important" }} />}
        onClick={handleOpen}
        sx={{
          textTransform: "none",
          fontSize: "0.75rem",
          fontWeight: 600,
          borderRadius: "8px",
          py: 0.4,
          px: 1.25,
          borderColor: "rgba(99,102,241,0.35)",
          color: "#6366f1",
          "&:hover": { borderColor: "#6366f1", bgcolor: "rgba(99,102,241,0.05)" },
        }}
      >
        {label}
      </Button>

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              width: 320,
              overflow: "hidden",
            },
          },
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <Typography
            variant="caption"
            fontWeight={600}
            color="text.secondary"
            display="block"
            sx={{ textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}
          >
            Link to a Case
          </Typography>
          <TextField
            size="small"
            placeholder="Search cases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: "100%",
              "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: "0.85rem" },
            }}
          />
        </Box>

        <Box sx={{ maxHeight: 280, overflowY: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4, gap: 1 }}>
              <CircularProgress size={20} sx={{ color: "#6366f1" }} />
              <Typography variant="body2" color="text.secondary">
                Loading…
              </Typography>
            </Box>
          ) : filteredCases.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4, px: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {search ? "No cases match your search" : "No eligible cases to link"}
              </Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {filteredCases.map((c, i) => (
                <React.Fragment key={c.id}>
                  {i > 0 && <Divider />}
                  <ListItemButton onClick={() => handleSelect(c)} sx={{ px: 2, py: 1 }}>
                    <ListItemText
                      primary={c.caseNumber}
                      secondary={c.title}
                      slotProps={{
                        primary: {
                          style: { fontWeight: 600, fontSize: "0.82rem", color: "#4338ca" },
                        },
                        secondary: { style: { fontSize: "0.75rem" }, noWrap: true },
                      }}
                    />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
