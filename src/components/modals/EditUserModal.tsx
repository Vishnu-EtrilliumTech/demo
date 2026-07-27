'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  updateUser,
  fetchUser,
  updateSiteUser,
  fetchSiteUser,
  deleteOrganizationUser,
  deleteSiteUser,
} from '@/app/organization/services/api';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/contexts/ToastContext';
import { DeleteConfirmationModal } from '@/components/modals/DeleteConfirmationModal';
import {
  required,
  email,
  phone,
  maxLength,
  extractApiErrors,
  extractFieldErrors,
  getRoleLabel,
} from '@/utils';

interface EditUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  userId: string;
  siteId?: string | null;
  isSiteMode: boolean;
  userSiteId?: string | null;   // target user's own siteId from the user list API response
  isOrgMode?: boolean;      // true = org-level login → show Site field, Role disabled
  siteName?: string;        // pre-filled site name for the Site display field
  canEditAdmin?: boolean;   // site-level login: can assign SiteAdmin role
  canEditClerk?: boolean;   // site-level login: can assign SiteClerk role
  canDelete?: boolean;      // when true, shows a Delete User action
  userName?: string;        // target user's display name, shown in the delete confirmation
  onDeleteSuccess?: () => void; // called after the user is deleted (parent closes modal + refreshes list)
}

interface FormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: string;
  roles: string[];
}

const validationSchema = {
  fullName: { rules: [required('Full name'), maxLength('Full name', 100)] },
  emailId: { rules: [required('Email'), email(), maxLength('Email', 254)] },
  phoneNumber: { rules: [required('Phone number'), phone()] },
  gender: { rules: [required('Gender')] },
  // roles excluded from validation per backend
};

const fieldLabel = (label: string, isRequired?: boolean) => (
  <Typography
    component="label"
    sx={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', mb: 0.5 }}
  >
    {label}
    {isRequired && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
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

const disabledSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '0.875rem',
    bgcolor: '#f9fafb',
  },
};


export default function EditUserModal({
  open,
  onClose,
  onSuccess,
  organizationId,
  userId,
  siteId,
  isSiteMode,
  userSiteId,
  isOrgMode = false,
  siteName,
  canDelete = false,
  userName,
  onDeleteSuccess,
}: EditUserModalProps) {
  // Org login: use the target user's own siteId (from user list API).
  // Absent/empty = Head Office → org-level API. Non-empty = site user → site-level API.
  // Backend may send Guid.Empty instead of null/absent for site-less users — treat it the same as absent.
  // Falls back to isSiteMode/siteId for site-level login (no behavior change there).
  const isUnsetSiteId = !userSiteId || userSiteId === '00000000-0000-0000-0000-000000000000';
  const effectiveSiteId =
    !isUnsetSiteId
      ? userSiteId
      : (isSiteMode && siteId ? siteId : null);
  const effectiveIsSiteMode = effectiveSiteId !== null;

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    emailId: '',
    phoneNumber: '',
    gender: 'Male',
    roles: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { showSuccess, showError } = useToast();
  const { errors, validate, validateSingleField, clearFieldError, setErrors: setValidationErrors, reset: resetForm } =
    useFormValidation(validationSchema);

  // Determine the site display name
  const siteDisplayName = siteName || (!effectiveIsSiteMode ? 'Head Office' : '');

  // Fetch user data when modal opens
  useEffect(() => {
    if (!open || !userId) return;

    setIsLoading(true);
    setApiErrors(null);
    resetForm();

    const fetchData = async () => {
      try {
        const user = effectiveIsSiteMode && effectiveSiteId
          ? await fetchSiteUser(organizationId, effectiveSiteId, userId)
          : await fetchUser(organizationId, userId);

        if (!user) throw new Error('User not found');

        const genderForDisplay = user.gender === 'Transgender' ? 'Non-Binary' : user.gender;
        setFormData({
          fullName: user.fullName || '',
          emailId: user.emailId || '',
          phoneNumber: user.phoneNumber?.toString() || '',
          gender: genderForDisplay || 'Male',
          roles: user.roles || [],
        });
      } catch (error: unknown) {
        setApiErrors([
          (error as { response?: { data?: { errors?: string[] } } }).response?.data?.errors?.[0] ||
          'Failed to load user data',
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [open, userId, effectiveIsSiteMode, effectiveSiteId, organizationId, resetForm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateSingleField(name, value);
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;

    setIsSubmitting(true);
    try {
      const genderForApi = formData.gender === 'Non-Binary' ? 'Transgender' : formData.gender;
      const userData = {
        fullName: formData.fullName,
        emailId: formData.emailId,
        phoneNumber: formData.phoneNumber,
        gender: genderForApi || undefined,
        roles: formData.roles.map((role) => role.replace(/\s+/g, '')),
      };

      if (effectiveIsSiteMode && effectiveSiteId) {
        await updateSiteUser(organizationId, effectiveSiteId, userId, userData);
      } else {
        await updateUser(organizationId, userId, userData);
      }

      showSuccess('User updated successfully');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const apiErrorMessages = extractApiErrors(error);
      setApiErrors(apiErrorMessages);
      const fieldErrors = extractFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setValidationErrors(fieldErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (effectiveIsSiteMode && effectiveSiteId) {
        await deleteSiteUser(organizationId, effectiveSiteId, userId);
      } else {
        await deleteOrganizationUser(organizationId, userId);
      }
      showSuccess('User deleted successfully');
      setDeleteConfirmOpen(false);
      onDeleteSuccess?.();
      onClose();
    } catch (error: unknown) {
      showError(error instanceof Error ? error.message : 'Failed to delete user.');
      throw error;
    }
  };

  const currentRoleLabel = formData.roles[0] ? getRoleLabel(formData.roles[0]) : '';

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.4)' },
      }}
    >
      {/* Title */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pb: 0.5,
          pt: 2.5,
          px: 3,
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: '#1e293b' }}>
            Edit User
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.25 }}>
            Update user account details
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#64748b', mt: 0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            {apiErrors && apiErrors.length > 0 && (
              <Alert severity="error" onClose={() => setApiErrors(null)} sx={{ mb: 2, borderRadius: '8px' }}>
                {apiErrors.join(' ')}
              </Alert>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Full Name */}
              <Box>
                {fieldLabel('Full Name', true)}
                <TextField
                  fullWidth size="small" name="fullName" value={formData.fullName}
                  onChange={handleChange} placeholder="Enter full name"
                  error={!!errors.fullName} helperText={errors.fullName} sx={inputSx}
                />
              </Box>

              {/* Email (disabled) + Phone */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {fieldLabel('Email (Gmail)', true)}
                  <TextField
                    fullWidth size="small" name="emailId" type="email"
                    value={formData.emailId} disabled placeholder="Enter email address"
                    sx={disabledSx}
                  />
                </Grid>
                <Grid item xs={6}>
                  {fieldLabel('Phone', true)}
                  <TextField
                    fullWidth size="small" name="phoneNumber" value={formData.phoneNumber}
                    onChange={handleChange} onBlur={handleBlur} placeholder="10-digit mobile number"
                    error={!!errors.phoneNumber} helperText={errors.phoneNumber} sx={inputSx}
                  />
                </Grid>
              </Grid>

              {/* Gender */}
              <Box>
                {fieldLabel('Gender', true)}
                <TextField
                  select fullWidth size="small" name="gender" value={formData.gender}
                  onChange={handleChange}
                  error={!!errors.gender} helperText={errors.gender} sx={inputSx}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Non-Binary">Non-Binary</MenuItem>
                </TextField>
              </Box>

              {/* Site + Role (org login) OR Role only (site login) – both non-editable */}
              {isOrgMode ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    {fieldLabel('Site')}
                    <TextField
                      fullWidth size="small" value={siteDisplayName}
                      disabled sx={disabledSx}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    {fieldLabel('Role')}
                    <TextField
                      fullWidth size="small" value={currentRoleLabel}
                      disabled sx={disabledSx}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  {fieldLabel('Role', true)}
                  <TextField
                    fullWidth
                    size="small"
                    value={currentRoleLabel}
                    disabled
                    sx={disabledSx}
                  />
                </Box>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {canDelete && (
          <Button
            onClick={() => setDeleteConfirmOpen(true)}
            disabled={isSubmitting || isLoading}
            startIcon={<DeleteIcon fontSize="small" />}
            sx={{ textTransform: 'none', color: '#dc2626', fontWeight: 500, mr: 'auto' }}
          >
            Delete User
          </Button>
        )}
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={{ textTransform: 'none', fontWeight: 500, borderRadius: '12px', px: 3, color: '#64748b' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 3,
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            boxShadow: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
            },
            '&:disabled': { background: 'linear-gradient(135deg, #93c5fd, #60a5fa)', color: 'white' },
          }}
        >
          {isSubmitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Update User'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Delete Confirmation */}
    {canDelete && (
      <DeleteConfirmationModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        entityType="user"
        entityName={userName || formData.fullName}
      />
    )}
    </>
  );
}