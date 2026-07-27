'use client';

import React, { useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ChevronRight as ChevronRightIcon,
  FolderOpen as FolderOpenIcon,
} from '@mui/icons-material';
import { Case, User } from '../types';
import { StatusChip } from '@/components/StatusChip';
import SortableColumnHeader from '@/components/SortableColumnHeader';
import type { SortDirection } from '@/types/pagination';

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

interface CasesTableProps {
  cases: Case[];
  users: User[];
  showSiteColumn?: boolean;
  onCaseClick?: (c: Case) => void;
  onEditCase?: (c: Case) => void;
  onDeleteCase?: (c: Case) => void;
  deletingCaseId?: string | null;
  canEditCase?: (c: Case) => boolean;
  canDeleteCase?: (c: Case) => boolean;
  // Sorting (US3)
  sortBy?: string;
  sortDirection?: SortDirection;
  onSort?: (field: string, direction: SortDirection) => void;
  onClearSort?: () => void;
}

const CasesTable = React.memo<CasesTableProps>(({
  cases,
  users,
  showSiteColumn = false,
  onCaseClick,
  onEditCase,
  onDeleteCase,
  deletingCaseId,
  canEditCase,
  canDeleteCase,
  sortBy,
  sortDirection,
  onSort,
  onClearSort,
}) => {
  const userMap = useMemo(() => {
    const map = new Map<number | string, string>();
    for (const user of users) {
      if (user.id !== undefined) map.set(user.id, user.fullName);
      if (user.userId) map.set(user.userId, user.fullName);
    }
    return map;
  }, [users]);

  if (!cases || cases.length === 0) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        No cases to display.
      </Typography>
    );
  }

  const showActions = onEditCase || onDeleteCase;

  return (
    <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <Table sx={{ minWidth: 650 }} aria-label="cases table">
        <TableHead>
          <TableRow>
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="title"
                label="Case Title"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={{ ...headerCellSx, '&:first-of-type': { borderTopLeftRadius: '8px', pl: 3 } }}
              />
            ) : (
              <TableCell sx={{ ...headerCellSx, '&:first-of-type': { borderTopLeftRadius: '8px', pl: 3 } }}>
                Case Title
              </TableCell>
            )}
            <TableCell sx={headerCellSx}>Case Key</TableCell>
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="caseNumber"
                label="Case Number"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={headerCellSx}
              />
            ) : (
              <TableCell sx={headerCellSx}>Case Number</TableCell>
            )}
            <TableCell sx={headerCellSx}>CNR Number</TableCell>
            {showSiteColumn && <TableCell sx={headerCellSx}>Site</TableCell>}
            {onSort && onClearSort ? (
              <SortableColumnHeader
                field="status"
                label="Status"
                currentSortBy={sortBy}
                currentSortDirection={sortDirection}
                onSort={onSort}
                onClearSort={onClearSort}
                sx={headerCellSx}
              />
            ) : (
              <TableCell sx={headerCellSx}>Status</TableCell>
            )}
            <TableCell sx={headerCellSx}>Assigned To</TableCell>
            {showActions && (
              <TableCell
                sx={{
                  ...headerCellSx,
                  textAlign: 'right',
                  '&:last-child': { borderTopRightRadius: '8px', pr: 3 },
                }}
              >
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {cases.map((c) => {
            const canEdit = canEditCase ? canEditCase(c) : !!onEditCase;
            const canDelete = canDeleteCase ? canDeleteCase(c) : !!onDeleteCase;

            return (
              <TableRow
                key={c.id}
                hover
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.015)' },
                }}
              >
                {/* Case Title — clickable with folder icon + orange hover */}
                <TableCell sx={{ pl: 3 }}>
                  <Box
                    onClick={onCaseClick ? () => onCaseClick(c) : undefined}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      cursor: onCaseClick ? 'pointer' : 'default',
                      color: 'text.primary',
                      '&:hover .case-title-text': onCaseClick
                        ? { color: '#3b82f6' }
                        : {},
                      '&:hover .case-chevron': onCaseClick
                        ? { opacity: 1, color: '#3b82f6' }
                        : {},
                    }}
                  >
                    <FolderOpenIcon sx={{ fontSize: 18, color: '#3b82f6', flexShrink: 0 }} />
                    <Typography
                      className="case-title-text"
                      variant="body2"
                      fontWeight={500}
                      noWrap
                      title={c.title}
                      sx={{ transition: 'color 0.15s', textTransform: 'capitalize' }}
                    >
                      {c.title}
                    </Typography>
                    {onCaseClick && (
                      <ChevronRightIcon
                        className="case-chevron"
                        sx={{ fontSize: 16, opacity: 0.35, transition: 'opacity 0.15s, color 0.15s' }}
                      />
                    )}
                  </Box>
                </TableCell>

                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.caseKey || '—'}
                  </Typography>
                </TableCell>

                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.caseNumber || '—'}
                  </Typography>
                </TableCell>

                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {c.cnrNumber || '—'}
                  </Typography>
                </TableCell>

                {showSiteColumn && (
                  <TableCell sx={{ textTransform: 'capitalize' }}>
                    {c.siteName ? (
                      <Chip
                        label={c.siteName}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(20,184,166,0.08)',
                          color: 'rgb(13,148,136)',
                          fontWeight: 500,
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                        }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                )}

                <TableCell>
                  <StatusChip status={c.status} type="case" size="small" variant="filled" />
                </TableCell>

                <TableCell sx={{ textTransform: 'capitalize' }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {userMap.get(c.assignedToId) || '—'}
                  </Typography>
                </TableCell>

                {showActions && (
                  <TableCell sx={{ textAlign: 'right', pr: 3 }}>
                    <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                      {canEdit && onEditCase && (
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onEditCase(c); }}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                          >
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                      {canDelete && onDeleteCase && (
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); onDeleteCase(c); }}
                            disabled={deletingCaseId === c.id}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                          >
                            {deletingCaseId === c.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon sx={{ fontSize: 17 }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
});

CasesTable.displayName = 'CasesTable';

export default CasesTable;
