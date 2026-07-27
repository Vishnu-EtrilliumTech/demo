"use client";
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
} from '@mui/material';
import type { Task } from '../types';
import { StatusChip } from '@/components/StatusChip';
import { formatDisplayDate } from '@/utils';

interface TasksTableProps {
  tasks: Task[];
}

export default function TasksTable({ tasks }: TasksTableProps) {
  if (!tasks || tasks.length === 0) {
    return <Typography sx={{ p: 2, textAlign: 'center' }}>No tasks to display.</Typography>;
  }

  // Status color logic moved to StatusChip component for consistency

  return (
    <TableContainer component={Paper} elevation={1} sx={{ borderRadius: '16px' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><Typography variant="subtitle2">Title</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Status</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Due Date</Typography></TableCell>
            <TableCell><Typography variant="subtitle2">Assigned To</Typography></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tasks.map((t) => (
            <TableRow key={`task-row-${t.id}`} hover>
              <TableCell sx={{ textTransform: 'capitalize' }}>{t.title}</TableCell>
              <TableCell>
                <StatusChip status={t.status} type="task" size="small" />
              </TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{t.dueDate ? formatDisplayDate(t.dueDate) : '—'}</TableCell>
              <TableCell sx={{ textTransform: 'capitalize' }}>{t.assignedToId ? `User ID: ${t.assignedToId}` : '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
