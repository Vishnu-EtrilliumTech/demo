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
  Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { createSite, checkSiteKeyAvailability } from "@/app/organization/services/api";
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

interface AddSiteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
}

interface AddressData {
  fullAddress: string;
  locality: string;
  district: string;
  state: string;
  pincode: string;
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
    "&:hover fieldset": { borderColor: "#3b82f6" },
    "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
    "&.Mui-error fieldset": { borderColor: "#ef4444" },
  },
};

const emptyForm = {
  name: "",
  siteKey: "",
  emailId: "",
  phoneNumber: "",
  address: "",
  locality: "",
  district: "",
  state: "",
  pincode: "",
  landmark: "",
  description: "",
};

export default function AddSiteModal({
  open,
  onClose,
  onSuccess,
  organizationId,
}: AddSiteModalProps) {
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const [siteKeyStatus, setSiteKeyStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable'>('idle');

  const { showSuccess, showError } = useToast();

  const validationSchema = {
    name: { rules: [required("Site name"), maxLength("Site name", 100)] },
    siteKey: { rules: [required("Site key"), maxLength("Site key", 5)] },
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
    reset: resetForm,
  } = useFormValidation(validationSchema);

  useEffect(() => {
    if (open) {
      setFormData({ ...emptyForm });
      setApiErrors(null);
      setSiteKeyStatus('idle');
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    const key = formData.siteKey?.trim();
    if (!key || !organizationId) {
      setSiteKeyStatus('idle');
      return;
    }
    setSiteKeyStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const isAvailable = await checkSiteKeyAvailability(organizationId, key);
        setSiteKeyStatus(isAvailable ? 'available' : 'unavailable');
      } catch {
        setSiteKeyStatus('idle');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [formData.siteKey, organizationId]);

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

    if (siteKeyStatus === 'unavailable') {
      setValidationErrors({ siteKey: "This site key is already taken" });
      return;
    }
    if (siteKeyStatus === 'checking' || siteKeyStatus === 'idle') {
      setValidationErrors({ siteKey: "Please wait while we check key availability" });
      return;
    }

    setIsSubmitting(true);
    try {
      await createSite(organizationId, {
        name: formData.name,
        siteKey: formData.siteKey,
        emailId: formData.emailId,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        locality: formData.locality,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        landmark: formData.landmark,
        description: formData.description,
        enabled: true,
      });
      showSuccess("Site created successfully");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const apiErrorMessages = extractApiErrors(error);
      setApiErrors(apiErrorMessages);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      } else {
        showError(apiErrorMessages[0] || "Failed to create site");
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
          Add New Site
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

              {/* Site Key */}
              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                  <Typography
                    component="label"
                    sx={{ fontSize: "0.875rem", fontWeight: 500, color: "#374151" }}
                  >
                    Site Key<span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>
                  </Typography>
                  <Tooltip
                    title="The site key is used to number cases within this site (e.g., ORG-SITE-001) and cannot be changed once the site is created."
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
                  name="siteKey"
                  value={formData.siteKey}
                  onChange={handleChange}
                  placeholder="Enter site key (Max 5 characters)"
                  error={!!errors.siteKey || siteKeyStatus === 'unavailable'}
                  helperText={errors.siteKey || (siteKeyStatus === 'unavailable' ? 'This site key is already taken' : undefined)}
                  sx={inputSx}
                  inputProps={{ maxLength: 5 }}
                  slotProps={{
                    input: {
                      endAdornment: siteKeyStatus === 'checking'
                        ? <CircularProgress size={16} sx={{ color: "#94a3b8", mr: 0.5 }} />
                        : siteKeyStatus === 'available'
                        ? <CheckCircleOutlinedIcon sx={{ fontSize: "1.1rem", color: "#16a34a", mr: 0.5 }} />
                        : null
                    }
                  }}
                />
                {siteKeyStatus === 'available' && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      mt: 0.75,
                      px: 1,
                      py: 0.5,
                      borderRadius: "6px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <InfoOutlinedIcon sx={{ fontSize: "0.875rem", color: "#d97706" }} />
                    <Typography sx={{ fontSize: "0.75rem", color: "#92400e" }}>
                      Site key cannot be changed after the site is created.
                    </Typography>
                  </Box>
                )}
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
                    placeholder="Enter locality"
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
                    placeholder="Enter district"
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
                    placeholder="Enter state"
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
                    placeholder="Enter pincode"
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
                  placeholder="Enter landmark"
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
            "Create Site"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
