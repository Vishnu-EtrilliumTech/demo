'use client'
import styles from './page.module.css'
import { useEffect, useState } from "react";
import {
    Select,
    MenuItem,
    type SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import { fetchClients } from '@/app/admin-dashboard/services/api';
import type { ClientListItem } from '@/app/admin-dashboard/services/types';
import { useListQuery } from '@/hooks/useListQuery';
import ListFooterPager from '@/components/ListFooterPager';
import { TextSearchFilter, EnumSelectFilter } from '@/components/filters';
import type { PagedResponse } from '@/types/pagination';
import type { ClientListFilters } from '@/app/admin-dashboard/services/filterTypes';

export default function ClientsPage() {

    const [users, setUsers] = useState<ClientListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true)
    const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter } =
        useListQuery<ClientListFilters>({
            defaultSort: { sortBy: 'name', sortDirection: 'asc' },
            sortableFields: ['name', 'email', 'createdDate'],
            filterKeys: ['search', 'status'],
        });
    const [clientsMeta, setClientsMeta] = useState<PagedResponse<ClientListItem> | null>(null);
    useEffect(() => {
        const fetchData = async () => {
        setIsLoading(true);
        try {
            const page = await fetchClients(listParams);
            setUsers(page.items);
            setClientsMeta(page);
            }
        catch (error) {
            console.error('Error fetching data:', error);
            setUsers([]);
            }
        finally {
            setIsLoading(false);
            }
            };
            fetchData();
            }, [listParams]);
    return (
        <div className={styles.legalContainer}>
            <div className="flex flex-col text-center">
                <p className="font-bold text-[40px] text-[#222222]">Clients</p>
            </div>
            <div className="p-3">
                <div className="bg-white rounded-[16px] border-white-300 p-[10px]">
                    <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
                        <div className="flex gap-3 flex-wrap">
                            <TextSearchFilter
                                placeholder="Search clients..."
                                value={listState.filters.search}
                                onChange={(v) => setFilter('search', v)}
                                sx={{ width: 220 }}
                            />
                            <EnumSelectFilter
                                label="Status"
                                value={listState.filters.status}
                                options={[
                                    { value: 'Active', label: 'Active' },
                                    { value: 'Inactive', label: 'Inactive' },
                                ]}
                                onChange={(v) => setFilter('status', v)}
                                size="small"
                                sx={{ minWidth: 130 }}
                            />
                        </div>
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
                            sx={{ borderRadius: '20px', fontSize: '0.875rem', bgcolor: '#fafafa', minWidth: 160 }}
                        >
                            <MenuItem value="">Default sort</MenuItem>
                            <MenuItem value="name:asc">Name A→Z</MenuItem>
                            <MenuItem value="name:desc">Name Z→A</MenuItem>
                            <MenuItem value="email:asc">Email A→Z</MenuItem>
                            <MenuItem value="createdDate:desc">Newest first</MenuItem>
                            <MenuItem value="createdDate:asc">Oldest first</MenuItem>
                        </Select>
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
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
                <div className="text-center py-10 text-[#666666]">No clients found.</div>
            ) : (
                        // Note: this table's cell padding (10px/12px, not the 16px/8px `px-4 py-2` the
                        // Tailwind classes elsewhere on this page would suggest) and its 20px corner
                        // radius (not 16px) reproduce the *actual* current rendering, which is governed
                        // by `page.module.css`'s `.legalTable th/td` rules (higher CSS specificity than
                        // the plain utility classes previously on this table) — verified empirically
                        // against the pre-migration page, not guessed from the Tailwind class names.
                        <Table sx={{ minWidth: '100%', borderCollapse: 'collapse', bgcolor: '#fff', borderRadius: '20px', overflow: 'hidden' }}>
                            <TableHead sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: '#fff' }}>
                                <TableRow sx={{ bgcolor: '#003995' }}>
                                    {['Sr No', 'Name', 'Mobile Number', 'Email', 'Gender'].map((label) => (
                                        <TableCell
                                            key={label}
                                            sx={{
                                                p: '10px',
                                                fontWeight: 500,
                                                textAlign: 'left',
                                                color: '#fff',
                                                borderBottom: '2px solid #9ca3af',
                                            }}
                                        >
                                            {label}
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
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{user.name}</TableCell>
                                            <TableCell sx={cellSx}>{user.phone}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{user.email}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{user.gender}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
            )}
                    </TableContainer>
                    {clientsMeta && clientsMeta.totalCount > 0 && (
                        <ListFooterPager
                            page={listState.page}
                            pageSize={listState.pageSize}
                            totalCount={clientsMeta.totalCount}
                            totalPages={clientsMeta.totalPages}
                            hasNextPage={clientsMeta.hasNextPage}
                            hasPreviousPage={clientsMeta.hasPreviousPage}
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
