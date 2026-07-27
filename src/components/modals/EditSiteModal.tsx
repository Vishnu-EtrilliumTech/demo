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
  Grid,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { updateSite } from "@/app/organization/services/api";
import { Site } from "@/app/organization/types";
import { useFormValidation } from "@/hooks/useFormValidation";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { useToast } from "@/contexts/ToastContext";
import {
  required,
  generalEmail,
  phone,
  maxLength,
  pattern,
  extractApiErrors,
  extractFieldErrors,
  ValidationPatterns,
} from "@/utils";

interface EditSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  site: Site;
}

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
}

const fieldLabel = (label: string, required?: boolean) => (
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
    {required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
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
export default function EditSiteModal({
  open,
  onClose,
  onSuccess,
  organizationId,
  site,
}: EditSiteModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    emailId: "",
    phoneNumber: "",
    address: "",
    locality: "",
    district: "",
    state: "",
    pincode: "",
    landmark: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);

  const { showSuccess, showError } = useToast();

  const validationSchema = {
    name: { rules: [required("Site name"), maxLength("Site name", 100)] },
    emailId: { rules: [required("Email"), generalEmail(), maxLength("Email", 254)] },
    phoneNumber: { rules: [required("Phone number"), phone()] },
    address: { rules: [required("Address"), maxLength("Address", 200)] },
    locality: { rules: [required("Locality"), maxLength("Locality", 100)] },
    district: { rules: [required("District"), maxLength("District", 100)] },
    state: { rules: [required("State"), maxLength("State", 100)] },
    pincode: {
      rules: [
        required("Pincode"),
        pattern(
          "Pincode",
          ValidationPatterns.pincode,
          "Please enter a valid 6-digit pincode",
        ),
      ],
    },
    landmark: { rules: [required("Landmark"), maxLength("Landmark", 100)] },
    description: { rules: [required("Description"), maxLength("Description", 500)] },
  };

  const {
    errors,
    validate,
    clearFieldError,
    setErrors: setValidationErrors,
    reset: resetErrors,
  } = useFormValidation(validationSchema);

  // Pre-populate form when modal opens
  useEffect(() => {
    if (open && site) {
      setFormData({
        name: site.name || "",
        emailId: site.emailId || "",
        phoneNumber:
          site.phoneNumber !== undefined ? String(site.phoneNumber) : "",
        address: site.address || "",
        locality: site.locality || "",
        district: site.district || "",
        state: site.state || "",
        pincode: site.pincode || "",
        landmark: site.landmark || "",
        description: site.description || "",
      });
      setApiErrors(null);
      resetErrors();
    }
  }, [open, site, resetErrors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleAddressSelect = (addressData: AddressData) => {
    setFormData((prev) => ({
      ...prev,
      address: addressData.fullAddress,
      locality: addressData.locality,
      district: addressData.district,
      state: addressData.state,
      pincode: addressData.pincode,
    }));
    clearFieldError("address");
    clearFieldError("locality");
    clearFieldError("district");
    clearFieldError("state");
    clearFieldError("pincode");
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;

    setIsSubmitting(true);
    try {
      await updateSite(organizationId, site.id, {
        name: formData.name,
        emailId: formData.emailId || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address,
        locality: formData.locality || undefined,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        description: formData.description,
      });
      showSuccess("Site updated successfully");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const apiErrorMessages = extractApiErrors(error);
      setApiErrors(apiErrorMessages);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
        showError(apiErrorMessages[0] || "Failed to update site");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" },
      }}
      BackdropProps={{
        sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" },
      }}
    >
      {/* Title */}
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
          Edit Site
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 3, pt: 1, pb: 2, overflow: "hidden" }} dividers>
        {apiErrors && apiErrors.length > 0 && (
          <Alert
            severity="error"
            onClose={() => setApiErrors(null)}
            sx={{ mb: 2, borderRadius: "8px" }}
          >
            {apiErrors.join(" ")}
          </Alert>
        )}

        <Grid container spacing={2}>
          {/* Left Column */}
          <Grid item xs={6}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Site Name */}
              <Box>
                {fieldLabel("Site Name", true)}
                <TextField
                  fullWidth
                  size="small"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter site name"
                  error={!!errors.name}
                  helperText={errors.name}
                  sx={inputSx}
                />
              </Box>

              {/* Email */}
              <Box>
                {fieldLabel("Email", true)}
                <TextField
                  fullWidth
                  size="small"
                  name="emailId"
                  type="email"
                  value={formData.emailId}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  error={!!errors.emailId}
                  helperText={errors.emailId}
                  sx={inputSx}
                />
              </Box>

              {/* Phone Number */}
              <Box>
                {fieldLabel("Phone Number", true)}
                <TextField
                  fullWidth
                  size="small"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  sx={inputSx}
                />
              </Box>

              {/* Description */}
              <Box>
                {fieldLabel("Description", true)}
                <TextField
                  fullWidth
                  size="small"
                  name="description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter site description"
                  error={!!errors.description}
                  helperText={errors.description}
                  sx={inputSx}
                />
              </Box>
            </Box>
          </Grid>

          {/* Right Column */}
          <Grid item xs={6}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {/* Address */}
              <Box>
                {fieldLabel("Address", true)}
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, address: value }));
                    clearFieldError("address");
                  }}
                  onPlaceSelect={handleAddressSelect}
                  placeholder="Search for an address"
                  error={errors.address}
                />
              </Box>

              {/* Locality + District */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  {fieldLabel("Locality", true)}
                  <TextField
                    fullWidth
                    size="small"
                    name="locality"
                    value={formData.locality}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru"
                    error={!!errors.locality}
                    helperText={errors.locality}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  {fieldLabel("District", true)}
                  <TextField
                    fullWidth
                    size="small"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Bengaluru Urban"
                    error={!!errors.district}
                    helperText={errors.district}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>

              {/* State + Pincode */}
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  {fieldLabel("State", true)}
                  <TextField
                    fullWidth
                    size="small"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Karnataka"
                    error={!!errors.state}
                    helperText={errors.state}
                    sx={inputSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  {fieldLabel("Pincode", true)}
                  <TextField
                    fullWidth
                    size="small"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="e.g. 560034"
                    error={!!errors.pincode}
                    helperText={errors.pincode}
                    sx={inputSx}
                  />
                </Grid>
              </Grid>

              {/* Landmark */}
              <Box>
                {fieldLabel("Landmark", true)}
                <TextField
                  fullWidth
                  size="small"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="e.g. Near Sapphire Toys"
                  error={!!errors.landmark}
                  helperText={errors.landmark}
                  sx={inputSx}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Actions */}
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
            "Update Site"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
