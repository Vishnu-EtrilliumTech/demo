"use client";

import React from "react";
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
  CircularProgress,
  IconButton,
  FormControl,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Description as DescriptionIcon,
  Category as SegmentIcon,
} from "@mui/icons-material";

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

interface EditOrganizationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editFormData: {
    name: string;
    email: string;
    phone: string;
    description: string;
    segments: string[];
  };
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onSegmentsChange: (segments: string[]) => void;
  validationErrors: Record<string, string>;
  isSaving: boolean;
}

export default function EditOrganizationModal({
  open,
  onClose,
  onSave,
  editFormData,
  onInputChange,
  onSegmentsChange,
  validationErrors,
  isSaving,
}: EditOrganizationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: "blur(4px)", backgroundColor: "rgba(0,0,0,0.4)" },
      }}
    >
      {/* Header */}
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
          Edit Organization
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#64748b" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 1, pb: 2 }}>
        <Grid container spacing={2}>
          {/* Organization Name */}
          <Grid item xs={12} sm={6}>
            <label className=" text-sm text-gray-600 font-medium mb-1.5 flex items-center gap-1">
              <PersonIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
              Organization Name <span className="text-red-500">*</span>
            </label>
            <TextField
              fullWidth
              size="small"
              type="text"
              name="name"
              value={editFormData.name}
              onChange={onInputChange}
              placeholder="Enter organization name"
              required
              error={!!validationErrors.name}
              helperText={validationErrors.name}
              sx={inputSx}
            />
          </Grid>

          {/* Email Address */}
          <Grid item xs={12} sm={6}>
            <label className=" text-sm text-gray-600 font-medium mb-1.5 flex items-center gap-1">
              <EmailIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
              Email Address <span className="text-red-500">*</span>
            </label>
            <TextField
              fullWidth
              size="small"
              type="email"
              name="email"
              value={editFormData.email}
              onChange={onInputChange}
              placeholder="Enter email address"
              required
              error={!!validationErrors.emailId}
              helperText={validationErrors.emailId}
              sx={inputSx}
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12} sm={6}>
            <label className=" text-sm text-gray-600 font-medium mb-1.5 flex items-center gap-1">
              <DescriptionIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
              Description
            </label>
            <TextField
              fullWidth
              size="small"
              name="description"
              multiline
              rows={4}
              value={editFormData.description}
              onChange={onInputChange}
              placeholder="Enter organization description"
              sx={inputSx}
            />
          </Grid>

          {/* Phone Number */}
          <Grid item xs={12} sm={6}>
            <label className=" text-sm text-gray-600 font-medium mb-1.5 flex items-center gap-1">
              <PhoneIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
              Phone Number <span className="text-red-500">*</span>
            </label>
            <TextField
              fullWidth
              size="small"
              type="tel"
              name="phone"
              value={editFormData.phone}
              onChange={onInputChange}
              placeholder="Enter phone number"
              required
              error={!!validationErrors.phoneNumber}
              helperText={validationErrors.phoneNumber}
              sx={inputSx}
            />
          </Grid>

          {/* Segments */}
          <Grid item xs={12}>
            <label className=" text-sm text-gray-600 font-medium mb-1.5 flex items-center gap-1">
              <SegmentIcon sx={{ fontSize: 15, color: "#94a3b8" }} />
              Segments <span className="text-red-500">*</span>
            </label>
            {validationErrors.segments && (
              <p className="text-red-500 text-xs mb-1" role="alert">
                {validationErrors.segments}
              </p>
            )}
            <FormControl fullWidth error={!!validationErrors.segments} sx={inputSx}>
              <Select
                multiple
                size="small"
                value={editFormData.segments}
                onChange={(e) => {
                  const value = e.target.value;
                  onSegmentsChange(Array.isArray(value) ? value : [value]);
                }}
                input={<OutlinedInput />}
                renderValue={(selected) => (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        size="small"
                        onMouseDown={(e) => e.stopPropagation()}
                        onDelete={() =>
                          onSegmentsChange(
                            editFormData.segments.filter((s) => s !== value),
                          )
                        }
                        sx={{ backgroundColor: "#f1f5f9", fontSize: "0.75rem" }}
                      />
                    ))}
                  </Box>
                )}
                MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
              >
                {["Legal", "Insurance"].map((segment) => (
                  <MenuItem key={segment} value={segment}>
                    <Checkbox
                      checked={editFormData.segments.includes(segment)}
                    />
                    <ListItemText primary={segment} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={isSaving}
          sx={{ textTransform: "none", fontWeight: 500, borderRadius: "12px", px: 3, color: "#64748b" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={isSaving}
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
          {isSaving ? (
            <CircularProgress size={18} sx={{ color: "white" }} />
          ) : (
            "Save Changes"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
