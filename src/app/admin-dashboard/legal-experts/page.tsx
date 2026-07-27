/* eslint-disable */
'use client'

import {
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import styles from './page.module.css'
import { useEffect, useState } from 'react';
import { styled } from '@mui/system';
import { fetchLegalExperts } from '@/app/admin-dashboard/services/api';
import type { LegalExpertListItem } from '@/app/admin-dashboard/services/types';
import { useListQuery } from '@/hooks/useListQuery';
import ListFooterPager from '@/components/ListFooterPager';
import { TextSearchFilter, EnumSelectFilter } from '@/components/filters';
import type { PagedResponse } from '@/types/pagination';
import type { LegalExpertListFilters } from '@/app/admin-dashboard/services/filterTypes';


export default function LegalExpertsPage() {
    const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
        borderBottom: '1px solid #D4D4D4',
        '&:last-child': {
            borderBottom: 'none',
        },
    }));
        const [users, setUsers] = useState<LegalExpertListItem[]>([]);
        const [isLoading, setIsLoading] = useState(true)
        const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter, clearFilters } =
          useListQuery<LegalExpertListFilters>({
            defaultSort: { sortBy: 'name', sortDirection: 'asc' },
            sortableFields: ['name', 'expertType', 'approvalStatus'],
            filterKeys: ['expertType', 'approvalStatus', 'search'],
          });
        const [expertsMeta, setExpertsMeta] = useState<PagedResponse<LegalExpertListItem> | null>(null);
        useEffect(() => {
          const fetchData = async () => {
            setIsLoading(true);
            try {
              const page = await fetchLegalExperts(listParams);
              setUsers(page.items);
              setExpertsMeta(page);
            } catch (error) {
              console.error('Error fetching data:', error);
              setUsers([]);
            } finally {
              setIsLoading(false);
            }
          };

          fetchData();
        }, [listParams]);

    return (
        <div className={styles.legalContainer}>
            <div className="flex flex-col text-center">
                <p className="font-bold text-[40px] text-[#222222]">Legal Experts</p>
            </div>

            <div className="p-3">
            <div className="bg-white rounded-[16px] border-white-300 p-[10px]">

            <div className="flex justify-end gap-6 md:gap-10 flex-col md:flex-row">
                        <TextSearchFilter
                            placeholder="Search experts..."
                            value={listState.filters.search}
                            onChange={(v) => setFilter('search', v)}
                            sx={{ width: 220 }}
                        />
                        <EnumSelectFilter
                            label="Expert Type"
                            value={listState.filters.expertType}
                            options={[
                                { value: 'CA', label: 'CA' },
                                { value: 'Lawyer', label: 'Lawyer' },
                            ]}
                            onChange={(v) => setFilter('expertType', v)}
                            size="small"
                            sx={{ minWidth: 150 }}
                        />
                        <EnumSelectFilter
                            label="Approval Status"
                            value={listState.filters.approvalStatus}
                            options={[
                                { value: 'Approved', label: 'Approved' },
                                { value: 'Pending', label: 'Pending' },
                                { value: 'Rejected', label: 'Rejected' },
                            ]}
                            onChange={(v) => setFilter('approvalStatus', v)}
                            size="small"
                            sx={{ minWidth: 160 }}
                        />
                        <FormControl variant="outlined" sx={{ minWidth: 160 }}>
                        <div className="flex items-center gap-2">
                        <Typography>Sort by:</Typography>
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
                                sx={{ minWidth: 160, borderRadius: '20px', fontSize: '0.875rem', bgcolor: '#fafafa' }}
                            >
                                <CustomMenuItem value="">Default</CustomMenuItem>
                                <CustomMenuItem value="name:asc">Name A→Z</CustomMenuItem>
                                <CustomMenuItem value="name:desc">Name Z→A</CustomMenuItem>
                                <CustomMenuItem value="expertType:asc">Expert Type</CustomMenuItem>
                                <CustomMenuItem value="approvalStatus:asc">Approval Status</CustomMenuItem>
                            </Select>
                            </div>
                        </FormControl>

            </div>
            <TableContainer sx={{ borderRadius: '16px', overflowX: 'auto', pt: '20px', pb: '20px' }}>
            {isLoading ? (
                <div className="space-y-4 p-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex gap-4 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-8"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                    <div className="h-6 bg-gray-200 rounded flex-1"></div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
                <div className="text-center py-10 text-[#666666]">No legal experts found.</div>
            ) : (
                // Note: padding (10px th / 12px td, not `px-4 py-2`), the 20px corner radius (not
                // 16px), and — notably — the "Upcoming Appointment"/"Past Appointment" headers
                // rendering left-aligned rather than centered, all reproduce this table's *actual*
                // current rendering. `page.module.css`'s `.legalTable th, .legalTable td` rule sets
                // `text-align: left` with higher CSS specificity than the Tailwind `text-center`
                // class those two header cells carry today, so `text-center` was already being
                // silently overridden pre-migration — verified empirically against the live page,
                // not assumed from the source class names.
                <Table sx={{ minWidth: '100%', borderCollapse: 'collapse', bgcolor: '#fff', borderRadius: '20px', overflow: 'hidden' }}>
                    <TableHead sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: '#fff' }}>
                        <TableRow sx={{ bgcolor: '#003995' }}>
                            {[
                                { label: 'Sr No', nowrap: true },
                                { label: 'Name', nowrap: false },
                                { label: 'Phone Number', nowrap: true },
                                { label: 'Location', nowrap: false },
                                { label: 'Email', nowrap: false },
                                { label: 'Expert Type', nowrap: true },
                                { label: 'No.of Client', nowrap: true },
                                { label: 'Upcoming Appointment', nowrap: false },
                                { label: 'Past Appointment', nowrap: false },
                                { label: 'Fees', nowrap: false },
                            ].map((col) => (
                                <TableCell
                                    key={col.label}
                                    sx={{
                                        p: '10px',
                                        fontWeight: 500,
                                        textAlign: 'left',
                                        color: '#fff',
                                        borderBottom: '2px solid #9ca3af',
                                        whiteSpace: col.nowrap ? 'nowrap' : 'normal',
                                    }}
                                >
                                    {col.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody sx={{ background: 'linear-gradient(to right, #eff9f1, #fef4d9, #fdeeeb)' }}>
                        {users.map((user, index) => {
                            const isLastRow = index === users.length - 1;
                            const cellSx = {
                                p: '12px',
                                fontWeight: 400,
                                textAlign: 'left' as const,
                                borderBottom: isLastRow ? 'none' : '1px solid #ddd',
                            };
                            return (
                                <TableRow key={user.id}>
                                    <TableCell sx={cellSx}>{index + 1}</TableCell>
                                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{user.name}</TableCell>
                                    <TableCell sx={cellSx}>{user.phone}</TableCell>
                                    <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{user.location}</TableCell>
                                    <TableCell sx={{ ...cellSx, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{user.email}</TableCell>
                                    <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{user.expertType}</TableCell>
                                    <TableCell sx={cellSx}>{user.clientCount}</TableCell>
                                    <TableCell sx={cellSx}>{user.upcomingAppointments}</TableCell>
                                    <TableCell sx={cellSx}>{user.pastAppointments}</TableCell>
                                    <TableCell sx={cellSx}>{user.fees}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            )}
            </TableContainer>
            {expertsMeta && expertsMeta.totalCount > 0 && (
                <ListFooterPager
                    page={listState.page}
                    pageSize={listState.pageSize}
                    totalCount={expertsMeta.totalCount}
                    totalPages={expertsMeta.totalPages}
                    hasNextPage={expertsMeta.hasNextPage}
                    hasPreviousPage={expertsMeta.hasPreviousPage}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    disabled={isLoading}
                />
            )}
            </div>

            </div>
        </div>
    );
}
