"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { updateCase } from "@/app/organization/services/api"; // adjust import as needed
import { CaseStatus, User } from "@/app/organization/types";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useToast } from "@/contexts/ToastContext";
import {
  required,
  maxLength,
  extractApiErrors,
  extractFieldErrors,
  getStatusLabel,
} from "@/utils";

interface EditCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  siteId: string;
  caseData: {
    id: string;
    title: string;
    caseNumber: string;
    cnrNumber?: string;
    caseKey?: string;
    status: CaseStatus;
    description?: string;
    assignedToId?: string;
  };
  siteUsers: User[];
  loadingSiteUsers?: boolean;
}

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

export default function EditCaseModal({
  open,
  onClose,
  onSuccess,
  organizationId,
  siteId,
  caseData,
  siteUsers,
  loadingSiteUsers = false,
}: EditCaseModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    caseNumber: "",
    cnrNumber: "",
    status: "" as CaseStatus,
    assignedTo: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);

  const { showSuccess, showError } = useToast();

  const validationSchema = {
    title: { rules: [required("Case title"), maxLength("Case title", 100)] },
    caseNumber: {
      rules: [maxLength("Case number", 50)],
    },
    cnrNumber: {
      rules: [maxLength("CNR number", 100)],
    },
    status: { rules: [required("Status")] },
    assignedTo: { rules: [required("Assigned user")] },
  };

  const {
    errors,
    validate,
    clearFieldError,
    setErrors: setValidationErrors,
    reset: resetErrors,
  } = useFormValidation(validationSchema);

  // Populate form when modal opens
  useEffect(() => {
    if (open && caseData) {
      setFormData({
        title: caseData.title || "",
        caseNumber: caseData.caseNumber || "",
        cnrNumber: caseData.cnrNumber || "",
        status: caseData.status,
        assignedTo: caseData.assignedToId || "",
        description: caseData.description || "",
      });
      setApiErrors(null);
      resetErrors();
    }
  }, [open, caseData, resetErrors]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string | number } },
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;

    setIsSubmitting(true);
    try {
      await updateCase(organizationId, siteId, caseData.id, {
        title: formData.title,
        caseNumber: formData.caseNumber,
        cnrNumber: formData.cnrNumber,
        status: formData.status,
        assignedToId: formData.assignedTo,
        description: formData.description.trim() || undefined,
      });
      showSuccess("Case updated successfully");
      window.dispatchEvent(new CustomEvent('ecourts-quota-refresh'));
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const apiErrorMessages = extractApiErrors(error);
      setApiErrors(apiErrorMessages);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
        showError(apiErrorMessages[0] || "Failed to update case");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
          alignItems: "center",
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Typography
          sx={{ fontWeight: 700, fontSize: "1.125rem", color: "#1e293b" }}
        >
          Edit Case
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }} dividers>
        {apiErrors && apiErrors.length > 0 && (
          <Alert
            severity="error"
            onClose={() => setApiErrors(null)}
            sx={{ mb: 2, borderRadius: "8px" }}
          >
            {apiErrors.join(" ")}
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
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter case title"
                error={!!errors.title}
                helperText={errors.title}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={6}>
              {fieldLabel("Case Number", false)}
              <TextField
                fullWidth
                size="small"
                name="caseNumber"
                value={formData.caseNumber}
                onChange={handleChange}
                placeholder="e.g. 87435464666"
                error={!!errors.caseNumber}
                helperText={errors.caseNumber}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              {fieldLabel("CNR Number")}
              <TextField
                fullWidth
                size="small"
                name="cnrNumber"
                value={formData.cnrNumber}
                onChange={handleChange}
                placeholder="Enter CNR number"
                error={!!errors.cnrNumber}
                helperText={errors.cnrNumber}
                sx={inputSx}
              />
            </Grid>
            {caseData.caseKey && (
              <Grid item xs={12}>
                {fieldLabel("Case Key")}
                <TextField
                  fullWidth
                  size="small"
                  value={caseData.caseKey}
                  InputProps={{ readOnly: true }}
                  sx={{
                    ...inputSx,
                    "& .MuiOutlinedInput-root": {
                      ...inputSx["& .MuiOutlinedInput-root"],
                      bgcolor: "#f8fafc",
                      cursor: "default",
                    },
                  }}
                />
              </Grid>
            )}
          </Grid>

          {/* Status */}
          <Box>
            {fieldLabel("Status", true)}
            <FormControl fullWidth size="small" error={!!errors.status}>
              <InputLabel id="case-status-label">Status</InputLabel>
              <Select
                labelId="case-status-label"
                name="status"
                value={formData.status}
                onChange={handleChange}
                label="Status"
                sx={inputSx}
              >
                {Object.values(CaseStatus).map((status) => (
                  <MenuItem key={status} value={status}>
                    {getStatusLabel(status)}
                  </MenuItem>
                ))}
              </Select>
              {errors.status && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.5 }}
                >
                  {errors.status}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Assigned To */}
          <Box>
            {fieldLabel("Assigned To", true)}
            <FormControl fullWidth size="small" error={!!errors.assignedTo}>
              <InputLabel id="assigned-to-label">Assigned To</InputLabel>
              <Select
                labelId="assigned-to-label"
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                label="Assigned To"
                disabled={loadingSiteUsers}
                sx={inputSx}
              >
                {loadingSiteUsers ? (
                  <MenuItem value="" disabled>
                    Loading users...
                  </MenuItem>
                ) : siteUsers.length === 0 ? (
                  <MenuItem value="" disabled>
                    No users found
                  </MenuItem>
                ) : (
                  siteUsers.map((user) => (
                    <MenuItem
                      key={user.id || user.userId}
                      value={user.id || user.userId}
                    >
                      {user.fullName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.assignedTo && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.5 }}
                >
                  {errors.assignedTo}
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
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter case description (optional)"
              sx={inputSx}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ textTransform: "none", fontWeight: 500, borderRadius: "12px", px: 3, color: "#64748b" }}
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
            "Update Case"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
