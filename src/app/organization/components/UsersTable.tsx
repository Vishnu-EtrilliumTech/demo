import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Avatar,
} from '@mui/material';
import { User } from '../types';
import { formatDisplayDate, getRoleLabel } from '@/utils';
import SortableColumnHeader from '@/components/SortableColumnHeader';
import type { SortDirection } from '@/types/pagination';

// ── Avatar colour helper ─────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#7c3aed', '#2563eb', '#059669', '#ea580c',
  '#db2777', '#dc2626', '#d97706', '#0891b2',
];
const getAvatarColor = (name: string) => {
  const sum = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

// ── Shared header cell sx ────────────────────────────────────────────────────
const headerCellSx = {
  fontWeight: 600,
  backgroundColor: 'rgba(20, 184, 166, 0.06)',
  color: 'rgb(13, 148, 136)',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  borderBottom: '2px solid',
  borderColor: 'rgba(20, 184, 166, 0.2)',
  py: 1.5,
} as const;

// ── Props ────────────────────────────────────────────────────────────────────
interface UsersTableProps {
  users: User[];
  onRowClick?: (user: User) => void;
  hideLastLogin?: boolean;
  showPhoneColumn?: boolean;
  showSiteColumn?: boolean;
  // Sorting (US3)
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string, direction: SortDirection) => void;
  onClearSort?: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  onRowClick,
  hideLastLogin = false,
  showPhoneColumn = false,
  showSiteColumn = true,
  sortBy,
  sortDirection,
  onSort,
  onClearSort,
}) => {
  if (!users || users.length === 0) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>No users to display.</Typography>;
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Table sx={{ minWidth: 650 }} aria-label="users table">
        {/* ── Header ── */}
        <TableHead>
          <TableRow>
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="name"
                label="Full Name"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={{ ...headerCellSx, '&:first-of-type': { borderTopLeftRadius: '8px', pl: 3 } }}
              />
            ) : (
              <TableCell sx={{ ...headerCellSx, '&:first-of-type': { borderTopLeftRadius: '8px', pl: 3 } }}>
                Full Name
              </TableCell>
            )}
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="email"
                label="Email"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={headerCellSx}
              />
            ) : (
              <TableCell sx={headerCellSx}>Email</TableCell>
            )}
            {showPhoneColumn && <TableCell sx={headerCellSx}>Phone</TableCell>}
            {showSiteColumn  && <TableCell sx={headerCellSx}>Site</TableCell>}
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="role"
                label="Roles"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={headerCellSx}
              />
            ) : (
              <TableCell sx={headerCellSx}>Roles</TableCell>
            )}
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="createdDate"
                label="Registered"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={{ ...headerCellSx, '&:last-child': { borderTopRightRadius: '8px', pr: 3 } }}
              />
            ) : (
              <TableCell sx={{ ...headerCellSx, '&:last-child': { borderTopRightRadius: '8px', pr: 3 } }}>
                Registered
              </TableCell>
            )}
            {!hideLastLogin && (
              <TableCell sx={{ ...headerCellSx, '&:last-child': { borderTopRightRadius: '8px', pr: 3 } }}>
                Last Login
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        {/* ── Body ── */}
        <TableBody>
          {users.map((user, index) => {
            const initials = (user.fullName || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <TableRow
                key={`user-row-${user.userId}-${index}`}
                hover
                onClick={onRowClick ? () => onRowClick(user) : undefined}
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': { backgroundColor: 'grey.50' },
                }}
              >
                {/* Full Name */}
                <TableCell component="th" scope="row" sx={{ pl: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: getAvatarColor(user.fullName),
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500} noWrap title={user.fullName} sx={{ textTransform: 'capitalize' }}>
                      {user.fullName}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Email */}
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap title={user.emailId}>
                    {user.emailId}
                  </Typography>
                </TableCell>

                {/* Phone (optional) */}
                {showPhoneColumn && (
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    <Typography variant="body2" color="text.secondary">
                      {user.phoneNumber || ''}
                    </Typography>
                  </TableCell>
                )}

                {/* Site (optional) */}
                {showSiteColumn && (
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    <Typography variant="body2" color="text.secondary" noWrap title={user.siteName || ''}>
                      {user.siteName || '—'}
                    </Typography>
                  </TableCell>
                )}

                {/* Roles */}
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    title={user.roles?.map(getRoleLabel).join(', ')}
                  >
                    {user.roles && user.roles.length > 0 ? user.roles.map(getRoleLabel).join(', ') : 'No roles'}
                  </Typography>
                </TableCell>

                {/* Registered */}
                <TableCell sx={{ '&:last-child': { pr: 3 }, textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary">
                    {formatDisplayDate(user.registeredDate)}
                  </Typography>
                </TableCell>

                {/* Last Login (optional) */}
                {!hideLastLogin && (
                  <TableCell sx={{ '&:last-child': { pr: 3 }, textTransform: 'capitalize' }}>
                    <Typography variant="body2" color="text.secondary">
                      {user.lastLoginDate ? formatDisplayDate(user.lastLoginDate) : 'Never'}
                    </Typography>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default UsersTable;
