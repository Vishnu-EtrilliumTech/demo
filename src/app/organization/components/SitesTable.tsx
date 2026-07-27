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
import { Site } from '../types';
import SortableColumnHeader from '@/components/SortableColumnHeader';
import type { SortDirection } from '@/types/pagination';

interface SitesTableProps {
  sites: Site[];
  onRowClick?: (site: Site) => void;
  // Sorting (US3)
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string, direction: SortDirection) => void;
  onClearSort?: () => void;
}

const avatarPalette = [
  { bg: '#dcfce7', color: '#16a34a' },
  { bg: '#ede9fe', color: '#7c3aed' },
  { bg: '#dbeafe', color: '#2563eb' },
  { bg: '#fef9c3', color: '#ca8a04' },
  { bg: '#fee2e2', color: '#dc2626' },
  { bg: '#e0f2fe', color: '#0284c7' },
];

const headerCellSx = {
  fontWeight: 600,
  backgroundColor: 'rgba(20, 184, 166, 0.06)',
  color: 'rgb(13, 148, 136)',
  fontSize: '0.75rem',
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  borderBottom: '2px solid',
  borderColor: 'rgba(20, 184, 166, 0.2)',
  py: 1.5,
};

const SitesTable: React.FC<SitesTableProps> = ({
  sites,
  onRowClick,
  sortBy,
  sortDirection,
  onSort,
  onClearSort,
}) => {
  const formatAddress = (site: Site) => {
    let parts = [site.address, site.locality, site.district, site.state];
    parts = parts.filter(Boolean);
    let addressString = parts.join(', ');
    if (site.pincode) addressString += ` - ${site.pincode}`;
    return addressString;
  };

  if (!sites || sites.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center', color: '#64748b' }}>
        No sites to display.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Table sx={{ minWidth: 800 }} aria-label="sites table">
        <TableHead>
          <TableRow>
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="name"
                label="Site Name"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={{ ...headerCellSx, '&:first-of-type': { borderTopLeftRadius: '8px', pl: 3 } }}
              />
            ) : (
              <TableCell sx={{ ...headerCellSx, '&:first-of-type': { borderTopLeftRadius: '8px', pl: 3 } }}>
                Site Name
              </TableCell>
            )}
            <TableCell sx={headerCellSx}>Address</TableCell>
            <TableCell sx={headerCellSx}>Email</TableCell>
            <TableCell sx={headerCellSx}>Phone</TableCell>
            <TableCell sx={headerCellSx}>Site Key</TableCell>
            <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>Cases</TableCell>
            <TableCell
              sx={{
                ...headerCellSx,
                textAlign: 'center',
                '&:last-child': { borderTopRightRadius: '8px', pr: 3 },
              }}
            >
              Users
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sites.map((site, index) => {
            const palette = avatarPalette[index % avatarPalette.length];
            const initial = (site.name || '?')[0].toUpperCase();

            return (
              <TableRow
                key={`site-row-${site.id}-${index}`}
                hover
                onClick={onRowClick ? () => onRowClick(site) : undefined}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(site);
                        }
                      }
                    : undefined
                }
                sx={{
                  cursor: onRowClick ? 'pointer' : 'default',
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.015)' },
                }}
              >
                {/* Site Name */}
                <TableCell sx={{ pl: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        bgcolor: palette.bg,
                        color: palette.color,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {initial}
                    </Avatar>
                    <Typography
                      variant="body2"
                      fontWeight={500}
                      noWrap
                      title={site.name}
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {site.name}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Address */}
                <TableCell sx={{ maxWidth: 220, textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap title={formatAddress(site)}>
                    {formatAddress(site)}
                  </Typography>
                </TableCell>

                {/* Email */}
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap title={site.emailId || ''}>
                    {site.emailId || ''}
                  </Typography>
                </TableCell>

                {/* Phone */}
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary">
                    {site.phoneNumber || ''}
                  </Typography>
                </TableCell>

                {/* Site Key */}
                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary">
                    {site.siteKey}
                  </Typography>
                </TableCell>

                {/* Cases */}
                <TableCell sx={{ textAlign: 'center', textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary">
                    {site.casesCount ?? '—'}
                  </Typography>
                </TableCell>

                {/* Users */}
                <TableCell sx={{ textAlign: 'center', pr: 3, textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary">
                    {site.usersCount ?? '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default SitesTable;
