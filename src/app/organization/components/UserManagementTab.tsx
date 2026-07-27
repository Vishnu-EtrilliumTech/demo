'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Avatar,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Paper,
  MenuItem,
  Select,
  type SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import SortIcon from '@mui/icons-material/Sort';
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';

import { User, Site } from '../types';
import type { OrgUserListFilters, SiteUserListFilters } from '../types/listFilterTypes';
import { fetchOrganizationUsers, fetchSiteUsers, fetchOrganizationSites } from '../services/api';
import { useToast } from '@/contexts/ToastContext';
import { classifyListError } from '@/utils/errorHandler';
import { TextSearchFilter, EnumSelectFilter, EntityRefFilter } from '@/components/filters';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import EditUserModal from '@/components/modals/EditUserModal';
import { formatDisplayDate, getRoleLabel } from '@/utils';
import { useUserRole } from '@/hooks/useUserRole'; // adjust import path as needed
import { useListQuery } from '@/hooks/useListQuery';
import ListFooterPager from '@/components/ListFooterPager';
import type { PagedResponse } from '@/types/pagination';

// Dynamic import for the table component
import dynamic from 'next/dynamic';
const UsersTable = dynamic(() => import('./UsersTable'), { ssr: false });

interface UserManagementTabProps {
  organizationId: string;
  siteId?: string | null;          // if provided, fetch site‑scoped users; else fetch organization users
  hideAddButton?: boolean;         // when true, internal Add button is hidden (page provides its own)
  refreshKey?: number;             // trigger refetch when changed
  showSiteColumn?: boolean;        // explicitly control visibility of the site column in table view
}

export default function UserManagementTab({
  organizationId,
  siteId = null,
  hideAddButton = false,
  refreshKey = 0,
  showSiteColumn,
}: UserManagementTabProps) {
  const { showError } = useToast();

  // Permission hook
  const {
    isOrganizationAdmin,
    isOrganizationClerk,
    isSiteAdmin,
    isSiteLegalExpert,
    isSiteSrLegalExpert,
    canDeleteSiteUsersAsSiteAdmin,
    canDeleteSiteUsers,
    currentUserId,
    isLoading: rolesLoading,
  } = useUserRole(organizationId);

  // Server-driven paging + sorting + filtering (US2/US3/US4)
  // isSiteMode is known at render time from the siteId prop, so we can pick the right filter keys.
  const isSiteMode = !!siteId;
  const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter, clearFilters } =
    useListQuery<OrgUserListFilters | SiteUserListFilters>({
      defaultSort: { sortBy: 'name', sortDirection: 'asc' },
      sortableFields: ['name', 'email', 'createdDate', 'role'],
      filterKeys: isSiteMode
        ? ['role', 'status', 'search']
        : ['siteId', 'role', 'status', 'search'],
    });
  const [usersMeta, setUsersMeta] = useState<PagedResponse<User> | null>(null);

  // Data state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [notAuthorizedEditModalOpen, setNotAuthorizedEditModalOpen] = useState(false);

  // Org-level users (Organization Admin/Clerk) must never be edited or deleted from a site-scoped view,
  // regardless of whether the row happens to carry a siteId.
  const isOrgLevelUser = (user: User) =>
    !!user.roles?.some((r) => r === 'OrganizationAdmin' || r === 'OrganizationClerk');

  // An Organization Admin can only be edited/deleted by another Organization Admin — no other role, in any view.
  const isTargetOrgAdmin = (user: User) => !!user.roles?.includes('OrganizationAdmin');

  // A Site Admin can only be edited/deleted by a Site Admin, Organization Admin, or Organization Clerk —
  // Legal Experts (site or senior) are excluded, in any view.
  const isTargetSiteAdmin = (user: User) => !!user.roles?.includes('SiteAdmin');
  const canActOnSiteAdmin = isOrganizationAdmin || isOrganizationClerk || isSiteAdmin;

  // Per-user edit permission — Organization Clerks may only edit site-level users, not Head Office users,
  // except their own profile (self-edit is always allowed). Site Admins may edit any site user, never
  // Organization Admins/Clerks. Legal Experts (site or senior) may only edit their own profile.
  const canEditUserFn = useCallback(
    (user: User) => {
      const isSelf = !!currentUserId && String(user.id || user.userId) === currentUserId;
      if (isTargetOrgAdmin(user)) return isOrganizationAdmin;
      if (isTargetSiteAdmin(user)) return canActOnSiteAdmin;
      if (isSiteMode) {
        if (isSiteAdmin) return !isOrgLevelUser(user);
        if (isSiteLegalExpert || isSiteSrLegalExpert) return isSelf;
        return false;
      }
      if (isOrganizationAdmin) return true;
      if (isOrganizationClerk) return isSelf || !!user.siteId;
      return false;
    },
    [isSiteMode, isSiteAdmin, isSiteLegalExpert, isSiteSrLegalExpert, isOrganizationAdmin, isOrganizationClerk, canActOnSiteAdmin, currentUserId],
  );

  // Per-user delete permission — mirrors canEditUserFn: Site Admins may only delete site users.
  const canDeleteUserFn = useCallback(
    (user: User) => {
      if (isTargetOrgAdmin(user)) return isOrganizationAdmin;
      if (isTargetSiteAdmin(user)) return canActOnSiteAdmin;
      if (isSiteMode) return canDeleteSiteUsersAsSiteAdmin && !isOrgLevelUser(user);
      return canDeleteSiteUsers;
    },
    [isSiteMode, canDeleteSiteUsersAsSiteAdmin, canDeleteSiteUsers, isOrganizationAdmin, canActOnSiteAdmin],
  );

  // Fetch users (server-driven — no client-side filtering)
  const fetchUsers = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);
    try {
      let usersPage: PagedResponse<User>;
      if (isSiteMode && siteId) {
        usersPage = await fetchSiteUsers(organizationId, siteId, listParams);
      } else {
        usersPage = await fetchOrganizationUsers(organizationId, listParams);
      }
      setAllUsers(usersPage.items);
      setUsersMeta(usersPage);
    } catch (err) {
      const info = classifyListError(err);
      if (info.kind === 'invalid-filter') {
        showError(info.messages[0] ?? 'Invalid filter — please adjust and try again.');
      } else if (info.kind === 'forbidden') {
        setError('You do not have permission to view users for this organization.');
        setAllUsers([]);
      } else if (info.kind === 'auth') {
        setError('Session expired — please refresh the page.');
        setAllUsers([]);
      } else {
        console.error('Error fetching users:', err);
        setError('Failed to load users.');
        setAllUsers([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, siteId, isSiteMode, listParams, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, refreshKey]);

  // Fetch sites for the site filter (org mode only — site mode is already scoped to one site).
  useEffect(() => {
    if (isSiteMode || !organizationId) return;
    let cancelled = false;
    setIsLoadingSites(true);
    fetchOrganizationSites(organizationId)
      .then((sitesPage) => {
        if (!cancelled) setSites(sitesPage.items);
      })
      .catch((err) => {
        console.error('Error fetching sites for filter:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSites(false);
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId, isSiteMode]);

  const siteOptions = useMemo(
    () => sites.map((s) => ({ value: String(s.id), label: s.name })),
    [sites],
  );

  // Clicking a user (row or card) opens the edit modal if the current user has
  // edit or delete access to that user; otherwise it's a no-op (with a dedicated
  // "not authorized" dialog for the OrgClerk-vs-Head-Office edge case).
  const handleUserClick = (user: User) => {
    if (!canEditUserFn(user) && !canDeleteUserFn(user)) {
      // OrgClerk cannot edit org-level users (no siteId = Head Office)
      if (isOrganizationClerk && !isOrganizationAdmin && !user.siteId) {
        setNotAuthorizedEditModalOpen(true);
      }
      return;
    }
    setUserToEdit(user);
    setEditModalOpen(true);
  };

  // Avatar color helper
  const avatarColors = [
    '#7c3aed', '#2563eb', '#059669', '#ea580c',
    '#db2777', '#dc2626', '#d97706', '#0891b2',
  ];
  const getAvatarColor = (name: string) => {
    const sum = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return avatarColors[sum % avatarColors.length];
  };

  if (!organizationId) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>Organization not selected.</Typography>;
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 }, borderRadius: '16px', background: 'transparent' }}>
      {/* Search / Filter row + View Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', flex: 1 }}>
          <TextSearchFilter
            placeholder="Search users by name, email…"
            value={listState.filters.search}
            onChange={(v) => setFilter('search', v)}
            disabled={isLoading}
          />
          {!isSiteMode && siteOptions.length > 0 && (
            <EntityRefFilter
              label="Site"
              value={listState.filters.siteId}
              options={siteOptions}
              onChange={(v) => setFilter('siteId', v)}
              loading={isLoadingSites}
              disabled={isLoading}
            />
          )}
          <EnumSelectFilter
            label="Role"
            value={listState.filters.role}
            options={[
              { value: 'SiteAdmin', label: 'Site Admin' },
              { value: 'SiteClerk', label: 'Site Clerk' },
              { value: 'SiteLegalExpert', label: 'Legal Expert' },
              { value: 'SiteSrLegalExpert', label: 'Senior Legal Expert' },
              { value: 'OrganizationAdmin', label: 'Org Admin' },
              { value: 'OrganizationClerk', label: 'Org Clerk' },
            ]}
            onChange={(v) => setFilter('role', v)}
            disabled={isLoading}
          />
          {(listState.filters.search || listState.filters.role || listState.filters.status || (!isSiteMode && listState.filters.siteId)) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<FilterListOffIcon />}
              onClick={clearFilters}
              sx={{ borderRadius: '20px', textTransform: 'none', fontSize: '0.8125rem' }}
            >
              Clear filters
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Sort control — visible in grid view (table view uses column headers) */}
          {viewMode === 'grid' && (
            <Tooltip title="Sort order">
              <Select
                size="small"
                displayEmpty
                value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? 'asc'}` : ''}
                onChange={(e: SelectChangeEvent) => {
                  const val = e.target.value;
                  if (!val) { clearSort(); return; }
                  const [field, dir] = val.split(':');
                  setSort(field, dir as 'asc' | 'desc');
                }}
                startAdornment={<SortIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />}
                sx={{
                  borderRadius: '20px',
                  fontSize: '0.875rem',
                  bgcolor: '#fafafa',
                  minWidth: 140,
                  '& .MuiSelect-select': { py: '5px' },
                }}
              >
                <MenuItem value="">Default sort</MenuItem>
                <MenuItem value="name:asc">Name A→Z</MenuItem>
                <MenuItem value="name:desc">Name Z→A</MenuItem>
                <MenuItem value="email:asc">Email A→Z</MenuItem>
                <MenuItem value="createdDate:desc">Newest first</MenuItem>
                <MenuItem value="createdDate:asc">Oldest first</MenuItem>
              </Select>
            </Tooltip>
          )}
          <Box sx={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <Tooltip title="Grid View">
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  borderRadius: 0,
                  bgcolor: viewMode === 'grid' ? '#2563eb' : 'transparent',
                  color: viewMode === 'grid' ? '#ffffff' : '#3b82f6',
                  '&:hover': { bgcolor: viewMode === 'grid' ? '#1d4ed8' : '#f1f5f9' },
                }}
              >
                <ViewModuleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="List View">
              <IconButton
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  borderRadius: 0,
                  bgcolor: viewMode === 'table' ? '#2563eb' : 'transparent',
                  color: viewMode === 'table' ? '#ffffff' : '#3b82f6',
                  '&:hover': { bgcolor: viewMode === 'table' ? '#1d4ed8' : '#f1f5f9' },
                }}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {!hideAddButton && (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={() => {}} // add user modal should be opened by parent
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: '16px',
                px: 2,
              }}
            >
              Add User
            </Button>
          )}
        </Box>
      </Box>

      {/* Content */}
      {isLoading || rolesLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
          <Typography sx={{ ml: 1 }}>Loading users...</Typography>
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ p: 2, textAlign: 'center' }}>
          {error}
        </Typography>
      ) : allUsers.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <SearchOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No users found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {listState.filters.search || listState.filters.role || listState.filters.siteId
              ? 'Try adjusting your filters to find what you\'re looking for.'
              : 'No users available for this scope.'}
          </Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {allUsers.map((user, index) => {
            const avatarBg = getAvatarColor(user.fullName);
            const initials = (user.fullName || '?')
              .split(' ')
              .map(n => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            const canOpen = canEditUserFn(user) || canDeleteUserFn(user);

            return (
              <Grid item xs={12} sm={6} md={4} key={`user-grid-${user.id || user.userId}-${index}`}>
                <Card
                  onClick={() => handleUserClick(user)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    border: '1px solid #f1f5f9',
                    cursor: canOpen ? 'pointer' : 'default',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      borderColor: '#e2e8f0',
                      '& .user-card-name': { color: '#3b82f6' },
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" p={2}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: avatarBg,
                        color: '#fff',
                        mr: 1.5,
                        fontSize: '1rem',
                        fontWeight: 600,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Box flexGrow={1} sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        noWrap
                        title={user.fullName}
                        className="user-card-name"
                        sx={{ fontWeight: 600, fontSize: '1rem', transition: 'color 0.2s ease' }}
                      >
                        {user.fullName}
                      </Typography>
                    </Box>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <EmailIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary" noWrap title={user.emailId}>
                        {user.emailId}
                      </Typography>
                    </Box>
                    {user.phoneNumber && (
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary">
                          {user.phoneNumber}
                        </Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" mb={1}>
                      <BadgeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary" noWrap title={user.roles?.map(getRoleLabel).join(', ')}>
                        {user.roles?.map(getRoleLabel).join(', ') || 'No roles'}
                      </Typography>
                    </Box>
                    <Typography variant="caption" display="block" color="textSecondary">
                      Registered: {formatDisplayDate(user.registeredDate)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <UsersTable
          users={allUsers}
          onRowClick={handleUserClick}
          showPhoneColumn
          showSiteColumn={showSiteColumn !== undefined ? showSiteColumn : !isSiteMode}
          sortBy={listState.sortBy}
          sortDirection={listState.sortDirection}
          onSort={setSort}
          onClearSort={clearSort}
        />
      )}

      {!isLoading && !rolesLoading && !error && usersMeta && usersMeta.totalCount > 0 && (
        <ListFooterPager
          page={listState.page}
          pageSize={listState.pageSize}
          totalCount={usersMeta.totalCount}
          totalPages={usersMeta.totalPages}
          hasNextPage={usersMeta.hasNextPage}
          hasPreviousPage={usersMeta.hasPreviousPage}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={isLoading}
        />
      )}

      {/* Edit User Modal */}
      {userToEdit && (
        <EditUserModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setUserToEdit(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setUserToEdit(null);
            fetchUsers();
          }}
          organizationId={organizationId}
          userId={String(userToEdit.id || userToEdit.userId)}
          siteId={isSiteMode ? siteId : null}
          isSiteMode={isSiteMode}
          userSiteId={userToEdit.siteId ?? null}
          isOrgMode={!isSiteMode}
          siteName={userToEdit.siteName || (isSiteMode ? '' : 'Head Quarters')}
          canEditAdmin={!isSiteMode ? true : false}
          canEditClerk={true}
          canDelete={canDeleteUserFn(userToEdit)}
          userName={userToEdit.fullName}
          onDeleteSuccess={() => {
            setEditModalOpen(false);
            setUserToEdit(null);
            fetchUsers();
          }}
        />
      )}

      {/* Not Authorized — Edit Org-Level User */}
      <Dialog
        open={notAuthorizedEditModalOpen}
        onClose={() => setNotAuthorizedEditModalOpen(false)}
        PaperProps={{ sx: { borderRadius: '16px', p: 1, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          Edit User — Restricted Access
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            You are not authorized to edit Organization level users.
            Only site-level users can be edited with your current role.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ pb: 2, pr: 2 }}>
          <Button
            onClick={() => setNotAuthorizedEditModalOpen(false)}
            variant="contained"
            size="small"
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}