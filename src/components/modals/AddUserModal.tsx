'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { createUser, createSiteUser, fetchOrganizationSites } from '@/app/organization/services/api';
import { Site } from '@/app/organization/types';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/contexts/ToastContext';
import {
  required,
  email,
  phone,
  maxLength,
  extractApiErrors,
  extractFieldErrors,
} from '@/utils';

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organizationId: string;
  isOrgMode: boolean;
  siteId?: string | null;
  canCreateAdmin: boolean;
  canCreateClerk: boolean;
  hideHeadOffice?: boolean;   // when true, Head Office is hidden; OrgClerk-only restriction
}

interface FormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: string;
  selectedSiteId: string;
  roles: string[];
}

const HQ_ID = '__hq__';

const ORG_ROLES = [
  { value: 'Organization Admin', label: 'Organization Admin' },
  { value: 'Organization Clerk', label: 'Organization Clerk' },
];

const SITE_ROLES = [
  { value: 'SiteAdmin', label: 'Site Admin' },
  { value: 'SiteClerk', label: 'Site Clerk' },
  { value: 'SiteLegalExpert', label: 'Legal Expert' },
  { value: 'SiteSrLegalExpert', label: 'Senior Legal Expert' },
];

const emptyForm: FormData = {
  fullName: '',
  emailId: '',
  phoneNumber: '',
  gender: '',
  selectedSiteId: HQ_ID,
  roles: [],
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
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    fontSize: '0.875rem',
    bgcolor: '#fff',
    '&:hover fieldset': { borderColor: '#3b82f6' },
    '&.Mui-focused fieldset': { borderColor: '#3b82f6' },
    '&.Mui-error fieldset': { borderColor: '#ef4444' },
  },
};

export default function AddUserModal({
  open,
  onClose,
  onSuccess,
  organizationId,
  isOrgMode,
  siteId,
  canCreateAdmin,
  canCreateClerk,
  hideHeadOffice = false,
}: AddUserModalProps) {
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);

  const { showSuccess } = useToast();

  const validationSchema = useMemo(() => ({
    fullName: { rules: [required('Full name'), maxLength('Full name', 100)] },
    emailId: { rules: [required('Email'), email(), maxLength('Email', 254)] },
    phoneNumber: { rules: [required('Phone number'), phone()] },
    gender: { rules: [required('Gender')] },
    roles: { rules: [required('Role')] },
    ...(isOrgMode ? { selectedSiteId: { rules: [required('Site')] } } : {}),
  }), [isOrgMode]);

  const { errors, validate, validateSingleField, clearFieldError, setErrors: setValidationErrors, reset: resetForm } =
    useFormValidation(validationSchema);

  // Determine available roles based on selected site (org mode only)
  const isHQSelected = formData.selectedSiteId === HQ_ID;
  const availableRoles = isOrgMode
    ? isHQSelected
      ? ORG_ROLES
      : SITE_ROLES
    : SITE_ROLES.filter((r) => {
        if (r.value === 'SiteAdmin') return canCreateAdmin;
        if (r.value === 'SiteClerk') return canCreateClerk;
        return true;
      });

  // Track whether it's the initial mount to skip role-reset on first render
  const isMounted = useRef(false);

  // Fetch sites when modal opens (org mode only)
  useEffect(() => {
    if (!open) return;

    isMounted.current = false;
    setFormData({ ...emptyForm, selectedSiteId: hideHeadOffice ? '' : HQ_ID });
    setSites([]);
    setApiErrors(null);
    resetForm();

    if (isOrgMode) {
      setIsLoadingSites(true);
      fetchOrganizationSites(organizationId)
        .then((page) => setSites(page.items))
        .catch(() => setSites([]))
        .finally(() => setIsLoadingSites(false));
    }
  }, [open, hideHeadOffice, isOrgMode, organizationId, resetForm]);

  // Reset role when site selection changes — skip on initial mount
  useEffect(() => {
    if (!isOrgMode) return;
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    setFormData((prev) => ({ ...prev, roles: [] }));
    clearFieldError('roles');
  }, [formData.selectedSiteId, isOrgMode, clearFieldError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateSingleField(name, value);
  };

  const handleSiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, selectedSiteId: e.target.value, roles: [] }));
    clearFieldError('selectedSiteId');
    clearFieldError('roles');
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, roles: [e.target.value] }));
    clearFieldError('roles');
  };

  const handleSubmit = async () => {
    setApiErrors(null);
    if (!validate(formData)) return;

    // Guard: site-mode users need a valid siteId from the parent
    if (!isOrgMode && !siteId) {
      setApiErrors(['Site information is still loading. Please wait a moment and try again.']);
      return;
    }

    setIsSubmitting(true);
    try {
      const genderForApi = formData.gender === 'Non-Binary' ? 'Transgender' : formData.gender;
      const selectedRole = formData.roles[0];
      const isOrgRole = selectedRole === 'Organization Admin' || selectedRole === 'Organization Clerk';

      if (isOrgMode && isOrgRole) {
        // Org-level user creation
        await createUser(organizationId, {
          fullName: formData.fullName,
          emailId: formData.emailId,
          phoneNumber: formData.phoneNumber,
          gender: genderForApi,
          roles: formData.roles.map((r) => r.replace(/\s+/g, '')),
        });
      } else {
        // Site-level user creation
        const targetSiteId = isOrgMode ? formData.selectedSiteId : (siteId ?? '');
        await createSiteUser(organizationId, targetSiteId, {
          fullName: formData.fullName,
          emailId: formData.emailId,
          phoneNumber: formData.phoneNumber,
          gender: genderForApi,
          roles: formData.roles,
        });
      }

      showSuccess('User created successfully');
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

  return (
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
            Add User
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mt: 0.25 }}>
            Create a new user account
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#64748b', mt: 0.25 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ px: 3, pt: 2, pb: 2 }}>
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

          {/* Email + Phone */}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {fieldLabel('Email (Gmail)', true)}
              <TextField
                fullWidth size="small" name="emailId" type="email" value={formData.emailId}
                onChange={handleChange} onBlur={handleBlur} placeholder="Enter email address"
                error={!!errors.emailId} helperText={errors.emailId} sx={inputSx}
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
              <MenuItem value="" disabled>Select gender</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Non-Binary">Non-Binary</MenuItem>
            </TextField>
          </Box>

          {/* Site + Role (org mode: both shown; site mode: only role) */}
          {isOrgMode ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                {fieldLabel('Site', true)}
                <TextField
                  select fullWidth size="small" name="selectedSiteId"
                  value={formData.selectedSiteId}
                  onChange={handleSiteChange}
                  error={!!errors.selectedSiteId} helperText={errors.selectedSiteId}
                  sx={inputSx}
                  disabled={isLoadingSites}
                  SelectProps={{ displayEmpty: true }}
                >
                  {hideHeadOffice
                    ? <MenuItem value="" disabled>Select site</MenuItem>
                    : <MenuItem value={HQ_ID}>{isLoadingSites ? 'Loading…' : 'Head Office'}</MenuItem>
                  }
                  {sites.map((site) => (
                    <MenuItem key={site.id} value={String(site.id)}>
                      {site.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                {fieldLabel('Role', true)}
                <TextField
                  select fullWidth size="small" name="role"
                  value={formData.roles[0] || ''}
                  onChange={handleRoleChange}
                  error={!!errors.roles} helperText={errors.roles}
                  sx={inputSx}
                  SelectProps={{ displayEmpty: true }}
                >
                  <MenuItem value="" disabled>Select role</MenuItem>
                  {availableRoles.map((r) => (
                    <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          ) : (
            <Box>
              {fieldLabel('Role', true)}
              <TextField
                select fullWidth size="small" name="role"
                value={formData.roles[0] || ''}
                onChange={handleRoleChange}
                error={!!errors.roles} helperText={errors.roles}
                sx={inputSx}
                SelectProps={{ displayEmpty: true }}
              >
                <MenuItem value="" disabled>Select role</MenuItem>
                {availableRoles.map((r) => (
                  <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                ))}
              </TextField>
            </Box>
          )}
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
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
          disabled={isSubmitting || isLoadingSites}
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
          {isSubmitting ? <CircularProgress size={18} sx={{ color: 'white' }} /> : 'Add User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}