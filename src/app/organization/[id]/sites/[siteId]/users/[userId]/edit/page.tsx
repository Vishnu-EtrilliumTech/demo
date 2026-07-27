'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { updateSiteUser, fetchSiteUser } from '@/app/organization/services/api';
import styles from '@/app/organization/page.module.css';
import { useUserRole } from '@/hooks/useUserRole';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useToast } from '@/contexts/ToastContext';
import {
  required,
  email,
  phone,
  maxLength,
  extractApiErrors,
  extractFieldErrors
} from '@/utils';

interface FormData extends Record<string, unknown> {
  fullName: string;
  emailId: string;
  phoneNumber: string;
  gender: string;
  roles: string[];
}

// Validation schema for site user edit form
const validationSchema = {
  fullName: {
    rules: [required('Full name'), maxLength('Full name', 100)]
  },
  emailId: {
    rules: [required('Email'), email(), maxLength('Email', 254)]
  },
  phoneNumber: {
    rules: [required('Phone number'), phone()]
  },
  gender: {
    rules: [required('Gender')]
  }
  // Note: roles field is removed from update model per backend
};

// Pill-shaped (rounded-full) outlined input styling matching the pre-migration
// Tailwind look: gray-300 border normally, red-500 border when `error` is set
// (MUI's own error prop drives the `.Mui-error` state below).
const pillFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '9999px',
    '& fieldset': { borderColor: '#d1d5db' },
    '&:hover fieldset': { borderColor: '#d1d5db' },
    '&.Mui-error fieldset': { borderColor: '#ef4444' },
  },
  '& .MuiOutlinedInput-input': { padding: '12px' },
} as const;

// Disabled email field additionally gets the legacy `bg-gray-100` background.
const disabledFieldSx = {
  '& .MuiOutlinedInput-root.Mui-disabled': { backgroundColor: '#f3f4f6' },
} as const;

// Same pill treatment for `TextField select` dropdowns, plus hiding the MUI
// dropdown arrow: the legacy `<select>` used `appearance-none` with no
// replacement chevron (no @tailwindcss/forms plugin in this project), so no
// arrow is shown today and none should appear after migration.
const pillSelectSx = {
  ...pillFieldSx,
  '& .MuiSelect-select': { paddingRight: '12px !important' },
  '& .MuiSelect-icon': { display: 'none' },
} as const;

// "Back to Users" button styling. Note: the legacy classes `text-primary-600`
// / `hover:text-primary-800` are no-ops in this app (tailwind.config.ts defines
// no `primary` color scale), so the button's actual current text color is the
// inherited body foreground (`--foreground: #1a1f36`), not blue. Reproduced
// literally here rather than introducing a new (incorrect) blue color.
const backButtonSx = {
  display: 'flex',
  alignItems: 'center',
  color: '#1a1f36',
  mb: 3,
  px: 2,
  py: 1,
  borderRadius: '9999px',
  border: '1px solid #d1d5db',
  fontWeight: 500,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
  },
} as const;

const submitButtonSx = {
  mt: 2,
  width: '123px',
  bgcolor: '#EA4234',
  color: '#fff',
  borderRadius: '9999px',
  textTransform: 'none',
  fontWeight: 400,
  '&:hover': { bgcolor: '#EA4234' },
  '&.Mui-disabled': { bgcolor: '#EA4234', color: '#fff', opacity: 0.7 },
} as const;

export default function EditSiteUserPage({ params }: { params: Promise<{ id: string; siteId: string; userId: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const { id: organizationId, siteId, userId } = resolvedParams;

  // Get current user's roles to filter available role options
  const { isSiteClerk, isSiteLegalExpert, isSiteSrLegalExpert } = useUserRole(organizationId);

  // Legal Experts and Site Clerks cannot create/assign Site Admins or Site Clerks
  const isLegalExpert = isSiteLegalExpert || isSiteSrLegalExpert;
  const canAssignAdmin = !isSiteClerk && !isLegalExpert;
  const canAssignClerk = !isLegalExpert;

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    emailId: '',
    phoneNumber: '',
    gender: 'Male',
    roles: [],
  });

  const { errors, validate, clearFieldError, setErrors: setValidationErrors } = useFormValidation(validationSchema);
  const { showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await fetchSiteUser(organizationId, siteId, userId);
        if (!user) {
          throw new Error('User not found');
        }
        // Transform "Transgender" from API to "Non-Binary" for display
        const genderForDisplay = user.gender === 'Transgender' ? 'Non-Binary' : user.gender;

        setFormData({
          fullName: user.fullName || '',
          emailId: user.emailId || '',
          phoneNumber: user.phoneNumber?.toString() || '',
          gender: genderForDisplay || 'Male',
          roles: user.roles || [],
        });
      } catch (error: unknown) {
        console.error('Error fetching site user:', error);
        setApiErrors([(error as { response?: { data?: { errors?: string[] } } }).response?.data?.errors?.[0] || 'Failed to load user data']);
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId && siteId && userId) {
      fetchUserData();
    } else {
      setApiErrors(['Invalid organization, site, or user ID']);
      setIsLoading(false);
    }
  }, [organizationId, siteId, userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      roles: [value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiErrors(null);

    if (!validate(formData)) {
      return;
    }

    if (!userId) {
      setApiErrors(['User ID is required']);
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform "Non-Binary" to "Transgender" for API
      const genderForApi = formData.gender === 'Non-Binary' ? 'Transgender' : formData.gender;

      const userData = {
        fullName: formData.fullName,
        emailId: formData.emailId,
        phoneNumber: formData.phoneNumber || undefined,
        gender: genderForApi || undefined,
        roles: formData.roles.map(role => role.replace(/\s+/g, '')),
      };

      await updateSiteUser(organizationId, siteId, userId, userData);

      // Show success message before navigation
      showSuccess('User updated successfully');

      router.push(`/organization/${organizationId}/sites/${siteId}#users`);
    } catch (error: unknown) {
      console.error('Error updating site user:', error);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!userId || !siteId) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-red-500 text-lg mt-4 mb-4">User ID and Site ID are required</p>
      </div>
    );
  }

  return (
    <div className={styles.orgContainer}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => router.push(`/organization/${organizationId}/sites/${siteId}#users`)}
            startIcon={<ArrowBackIcon fontSize="small" />}
            sx={backButtonSx}
          >
            Back to Users
          </Button>

          <div className="bg-white p-8 rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Site User</h2>
            <p className="text-lg text-gray-600 mb-8">Update user details below</p>

            {apiErrors && apiErrors.length > 0 && (
              <Alert severity="error" onClose={() => setApiErrors(null)} sx={{ mb: 3 }}>
                <AlertTitle sx={{ fontWeight: 500 }}>
                  {apiErrors.length === 1 ? 'Error' : `${apiErrors.length} Errors occurred`}
                </AlertTitle>
                <ul className="list-disc list-inside space-y-1">
                  {apiErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ '& > * + *': { mt: 3 } }}>
              <div>
                <label className="block text-base text-gray-700 font-medium mb-2">
                  Full Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <TextField
                  fullWidth
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                  sx={pillFieldSx}
                />
              </div>

              <div>
                <label className="block text-base text-gray-700 font-medium mb-2">
                  Email (Gmail)
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <TextField
                  fullWidth
                  type="email"
                  name="emailId"
                  value={formData.emailId}
                  onChange={handleChange}
                  disabled
                  error={!!errors.emailId}
                  helperText={errors.emailId}
                  sx={[pillFieldSx, disabledFieldSx]}
                />
              </div>

              <div>
                <label className="block text-base text-gray-700 font-medium mb-2">
                  Phone Number
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <TextField
                  fullWidth
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber}
                  sx={pillFieldSx}
                />
              </div>

              <div>
                <label className="block text-base text-gray-700 font-medium mb-2">
                  Gender
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <TextField
                  select
                  fullWidth
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  error={!!errors.gender}
                  helperText={errors.gender}
                  sx={pillSelectSx}
                >
                  <MenuItem value="">Select gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Non-Binary">Non-Binary</MenuItem>
                </TextField>
              </div>

              <div>
                <label className="block text-base text-gray-700 font-medium mb-2">
                  Role
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <TextField
                  select
                  fullWidth
                  name="role"
                  value={formData.roles[0] || ''}
                  onChange={handleRoleChange}
                  disabled
                  sx={pillSelectSx}
                >
                  <MenuItem value="" disabled>Select a role</MenuItem>
                  {/* Only Site Admins and Org-level users can assign Site Admin role */}
                  {canAssignAdmin && <MenuItem value="SiteAdmin">Admin</MenuItem>}
                  {/* Legal Experts cannot assign Site Clerk role */}
                  {canAssignClerk && <MenuItem value="SiteClerk">Clerk</MenuItem>}
                  <MenuItem value="SiteLegalExpert">Legal Expert</MenuItem>
                  <MenuItem value="SiteSrLegalExpert">Senior Legal Expert</MenuItem>
                </TextField>
                <p className="text-sm text-gray-500 mt-1">Roles cannot be modified in edit mode</p>
              </div>

              <Box sx={{ pt: 2, display: 'flex', justifyContent: 'center' }}>
                <Button type="submit" disabled={isSubmitting} sx={submitButtonSx}>
                  {isSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Update'}
                </Button>
              </Box>
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}
