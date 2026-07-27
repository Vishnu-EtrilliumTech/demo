"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Alert,
  IconButton,
  Grid,
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import {
  fetchOrganizationSites,
  fetchSiteUsers,
  createCase,
} from "@/app/organization/services/api";
import { Site, User } from "@/app/organization/types";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useToast } from "@/contexts/ToastContext";
import { required, maxLength, extractApiErrors } from "@/utils";

interface AddCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  isOrgMode: boolean;
  /** siteId for site-level logins; null for org-level */
  siteId: string | null;
}

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    fontSize: "0.875rem",
    bgcolor: "#fff",
    "&:hover fieldset": { borderColor: "#3b82f6" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    "&.Mui-error fieldset": { borderColor: "#ef4444" },
  },
};

const fieldLabel = (label: string, isRequired?: boolean) => (
  <Typography
    component="label"
    sx={{
      display: "block",
      fontSize: "0.875rem",
      fontWeight: 500,
      color: "#374151",
      mb: 0.5,
    }}
  >
    {label}
    {isRequired && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
  </Typography>
);

export default function AddCaseModal({
  open,
  onClose,
  onSuccess,
  organizationId,
  isOrgMode,
  siteId,
}: AddCaseModalProps) {
  const { showSuccess } = useToast();

  const [title, setTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [cnrNumber, setCnrNumber] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const [sites, setSites] = useState<Site[]>([]);
  const [siteUsers, setSiteUsers] = useState<User[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validationSchema = {
    title: { rules: [required("Title"), maxLength("Title", 200)] },
    caseNumber: {
      rules: [maxLength("Case number", 100)],
    },
    cnrNumber: {
      rules: [maxLength("CNR number", 100)],
    },
    ...(isOrgMode ? { selectedSiteId: { rules: [required("Site")] } } : {}),
    assignedToId: { rules: [required("Assigned to")] },
  };

  const { errors, validate, clearFieldError, reset } =
    useFormValidation(validationSchema);

  // Fetch sites for org mode
  useEffect(() => {
    if (!open || !isOrgMode) return;
    setIsLoadingSites(true);
    fetchOrganizationSites(organizationId)
      .then((page) => setSites(page.items))
      .catch(() => setSites([]))
      .finally(() => setIsLoadingSites(false));
  }, [open, isOrgMode, organizationId]);

  // Fetch site users for site mode on open
  useEffect(() => {
    if (!open || isOrgMode || !siteId) return;
    let cancelled = false;
    setIsLoadingUsers(true);
    fetchSiteUsers(organizationId, siteId)
      .then((page) => {
        if (!cancelled) setSiteUsers(page.items);
      })
      .catch(() => {
        if (!cancelled) setSiteUsers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, isOrgMode, siteId, organizationId]);

  // Fetch site users when org-mode site changes
  useEffect(() => {
    if (!isOrgMode || !selectedSiteId) {
      setSiteUsers([]);
      setAssignedToId("");
      return;
    }
    let cancelled = false;
    setIsLoadingUsers(true);
    setAssignedToId("");
    fetchSiteUsers(organizationId, selectedSiteId)
      .then((page) => {
        if (!cancelled) setSiteUsers(page.items);
      })
      .catch(() => {
        if (!cancelled) setSiteUsers([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOrgMode, selectedSiteId, organizationId]);

  const handleClose = () => {
    setTitle("");
    setCaseNumber("");
    setCnrNumber("");
    setDescription("");
    setSelectedSiteId("");
    setAssignedToId("");
    setSiteUsers([]);
    setApiError(null);
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    const formValues: Record<string, unknown> = {
      title,
      caseNumber,
      cnrNumber,
      ...(isOrgMode ? { selectedSiteId } : {}),
      assignedToId,
    };

    if (!validate(formValues)) return;

    const resolvedSiteId = isOrgMode ? selectedSiteId : siteId!;

    setIsSubmitting(true);
    setApiError(null);
    try {
      await createCase(organizationId, resolvedSiteId, {
        title: title.trim(),
        caseNumber: caseNumber.trim(),
        cnrNumber: cnrNumber.trim(),
        description: description.trim() || undefined,
        assignedToId,
      });
      showSuccess("Case created successfully");
      window.dispatchEvent(new CustomEvent('ecourts-quota-refresh'));
      handleClose();
      onSuccess();
    } catch (err) {
      const messages = extractApiErrors(err);
      setApiError(
        messages.length > 0
          ? messages.join(" ")
          : "Failed to create case. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
      }}
      BackdropProps={{
        sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pb: 0.5,
          pt: 2.5,
          px: 3,
        }}
      >
        <Box>
          <Typography
            sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#1e293b" }}
          >
            Add Case
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#64748b", mt: 0.25 }}>
            Create a new case
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleClose}
          sx={{ color: "#64748b", mt: 0.25 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
        {apiError && (
          <Alert
            severity="error"
            onClose={() => setApiError(null)}
            sx={{ mb: 2, borderRadius: "8px" }}
          >
            {apiError}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Title & Case Number */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {fieldLabel("Title", true)}
              <TextField
                fullWidth
                size="small"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFieldError("title");
                }}
                error={!!errors.title}
                helperText={errors.title}
                placeholder="Enter case title"
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography
                  component="label"
                  sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}
                >
                  Case Number
                </Typography>
                <Tooltip
                  title="The case number is the unique identifier assigned to this case by the court (e.g., CS/1234/2024). You can find it on any official court document related to this case."
                  placement="right"
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.25, color: "#64748b" }}>
                    <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                size="small"
                value={caseNumber}
                onChange={(e) => {
                  setCaseNumber(e.target.value);
                  clearFieldError("caseNumber");
                }}
                error={!!errors.caseNumber}
                helperText={errors.caseNumber}
                placeholder="e.g. 87435464666"
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <Typography
                  component="label"
                  sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}
                >
                  CNR Number
                </Typography>
                <Tooltip
                  title="CNR (Case Number Record) is a unique 16-character alphanumeric identifier assigned to every case in India's eCourts system (e.g., MHAU010012342024). It can be found on the eCourts website or any court notice."
                  placement="right"
                  arrow
                >
                  <IconButton size="small" sx={{ p: 0.25, color: "#64748b" }}>
                    <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                fullWidth
                size="small"
                value={cnrNumber}
                onChange={(e) => {
                  setCnrNumber(e.target.value);
                  clearFieldError("cnrNumber");
                }}
                error={!!errors.cnrNumber}
                helperText={errors.cnrNumber}
                placeholder="Enter CNR number"
                sx={inputSx}
              />
            </Grid>
          </Grid>

          {/* Site dropdown (org mode only) */}
          {isOrgMode && (
            <Box>
              {fieldLabel("Site", true)}
              <FormControl
                fullWidth
                size="small"
                error={!!errors.selectedSiteId}
              >
                <Select
                  value={selectedSiteId}
                  onChange={(e) => {
                    setSelectedSiteId(e.target.value);
                    clearFieldError("selectedSiteId");
                  }}
                  displayEmpty
                  disabled={isLoadingSites}
                  sx={{
                    borderRadius: "8px",
                    fontSize: "0.875rem",
                    bgcolor: "#fff",
                  }}
                >
                  <MenuItem value="" disabled>
                    {isLoadingSites ? "Loading sites…" : "Select a site"}
                  </MenuItem>
                  {sites.map((site) => (
                    <MenuItem key={site.id} value={String(site.id)}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.selectedSiteId && (
                  <Typography
                    sx={{
                      color: "#ef4444",
                      fontSize: "0.75rem",
                      mt: 0.5,
                      ml: 1.75,
                    }}
                  >
                    {errors.selectedSiteId}
                  </Typography>
                )}
              </FormControl>
            </Box>
          )}

          {/* Assigned To */}
          <Box>
            {fieldLabel("Assigned To", true)}
            <FormControl fullWidth size="small" error={!!errors.assignedToId}>
              <Select
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  clearFieldError("assignedToId");
                }}
                displayEmpty
                disabled={isLoadingUsers || (isOrgMode && !selectedSiteId)}
                sx={{
                  borderRadius: "8px",
                  fontSize: "0.875rem",
                  bgcolor: "#fff",
                }}
              >
                <MenuItem value="" disabled>
                  {isLoadingUsers
                    ? "Loading users…"
                    : isOrgMode && !selectedSiteId
                      ? "Select a site first"
                      : "Select a user"}
                </MenuItem>
                {siteUsers.map((user) => (
                  <MenuItem
                    key={user.id ?? user.userId}
                    value={String(user.id ?? user.userId)}
                  >
                    {user.fullName}
                  </MenuItem>
                ))}
              </Select>
              {errors.assignedToId && (
                <Typography
                  sx={{
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    mt: 0.5,
                    ml: 1.75,
                  }}
                >
                  {errors.assignedToId}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Description */}
          <Box>
            {fieldLabel("Description")}
            <TextField
              fullWidth
              size="small"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter case description (optional)"
              sx={inputSx}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          sx={{
            textTransform: "none",
            fontWeight: 500,
            borderRadius: "12px",
            px: 3,
            color: "#64748b",
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderRadius: "12px",
            px: 3,
            background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
            boxShadow: "none",
            "&:hover": {
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              boxShadow: "0 4px 12px rgba(59,130,246,0.35)",
            },
            "&:disabled": { background: "linear-gradient(135deg, #93c5fd, #60a5fa)", color: "white" },
          }}
        >
          {isSubmitting ? (
            <CircularProgress size={18} sx={{ color: "white" }} />
          ) : (
            "Add Case"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
