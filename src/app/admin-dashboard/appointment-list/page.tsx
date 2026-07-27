'use client'

import {
    Button,
    FormControl,
    MenuItem,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    styled,
} from "@mui/material";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { fetchPendingAppointments, fetchPastAppointments } from '@/app/admin-dashboard/services/api';
import type { AppointmentListItem } from '@/app/admin-dashboard/services/types';
import { useListQuery } from '@/hooks/useListQuery';
import ListFooterPager from '@/components/ListFooterPager';
import { DateRangeFilter } from '@/components/filters';
import type { PagedResponse } from '@/types/pagination';
import type { AppointmentListFilters } from '@/app/admin-dashboard/services/filterTypes';


export default function AppointmentPage() {
    const [selectedTab, setSelectedTab] = useState("Future");
    const [futureAppointments, setFutureAppointments] = useState<AppointmentListItem[]>([]);
    const [completedAppointments, setCompletedAppointments] = useState<AppointmentListItem[]>([]);

    const CustomMenuItem = styled(MenuItem)(() => ({
        borderBottom: '1px solid #D4D4D4',
        '&:last-child': {
            borderBottom: 'none',
        },
    }));
    const [isLoading, setIsLoading] = useState(true)
    const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter } =
        useListQuery<AppointmentListFilters>({
            defaultSort: { sortBy: 'appointmentDate', sortDirection: 'asc' },
            sortableFields: ['appointmentDate'],
            filterKeys: ['from', 'to'],
        });
    const [futureMeta, setFutureMeta] = useState<PagedResponse<AppointmentListItem> | null>(null);
    const [pastMeta, setPastMeta] = useState<PagedResponse<AppointmentListItem> | null>(null);
    useEffect(() => {
        const fetchData = async () => {
        setIsLoading(true);
        try {
            const [pending, past] = await Promise.all([
                fetchPendingAppointments(listParams),
                fetchPastAppointments(listParams),
            ]);
            setFutureAppointments(pending.items);
            setCompletedAppointments(past.items);
            setFutureMeta(pending);
            setPastMeta(past);
        } catch (error) {
            console.error('Error fetching data:', error);
            setFutureAppointments([]);
            setCompletedAppointments([]);
            } finally {
                setIsLoading(false);
                }
                };

                fetchData();
              }, [listParams]);

    const appointments = selectedTab === "Future" ? futureAppointments : completedAppointments;
    const appointmentsMeta = selectedTab === "Future" ? futureMeta : pastMeta;


    return (
        <div className={styles.appointmentContainer}>
            <div className="flex flex-col text-center">
                <p className="font-bold text-[40px] text-[#222222]">My Appointments</p>
            </div>

            <div className="p-3">
                <div className="flex items-center flex-wrap justify-between mb-[20px]">
                    <div className="flex-1 flex justify-center overflow-x-auto scrollbar-hide">
                        <div className="flex items-center space-x-4 flex-nowrap">
                            <div
                                className="flex items-center cursor-pointer"
                                onClick={() => setSelectedTab("Future")}
                            >
                                <span className={`rounded-full w-4 h-4 mr-2 ${ selectedTab === "Future" ? "bg-[#003995]" : "border border-[#003995]" }`} ></span>
                                <Button
                                    disableRipple
                                    disableFocusRipple
                                    sx={{
                                        p: 0,
                                        minWidth: 'auto',
                                        fontSize: '14px',
                                        textTransform: 'none',
                                        color: '#003995',
                                        fontWeight: selectedTab === 'Future' ? 700 : 300,
                                        bgcolor: 'transparent',
                                        '&:hover': { bgcolor: 'transparent' },
                                    }}
                                >
                                    Future Appointments
                                </Button>
                            </div>
                            <div className="w-10 border-t border-[#CFD6DC]"></div>

                            <div
                                className="flex items-center cursor-pointer"
                                onClick={() => setSelectedTab("Completed")}
                            >
                                <span className={`rounded-full w-4 h-4 mr-2 ${ selectedTab === "Completed"  ? "bg-[#003995]" : "border border-[#003995]" }`} ></span>
                                <Button
                                    disableRipple
                                    disableFocusRipple
                                    sx={{
                                        p: 0,
                                        minWidth: 'auto',
                                        fontSize: '14px',
                                        textTransform: 'none',
                                        color: '#003995',
                                        fontWeight: selectedTab === 'Completed' ? 700 : 300,
                                        bgcolor: 'transparent',
                                        '&:hover': { bgcolor: 'transparent' },
                                    }}
                                >
                                    Completed Appointments
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[16px] border-white-300 p-[10px]">
                <div className="flex flex-col lg:flex-row gap-4 w-full justify-end">
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">

                    <div>
                        <FormControl variant="outlined" sx={{ minWidth: 160 }}>
                        <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-sm sm:text-base">Sort:</span>
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
                            <CustomMenuItem value="appointmentDate:asc">Date ↑</CustomMenuItem>
                            <CustomMenuItem value="appointmentDate:desc">Date ↓</CustomMenuItem>
                        </Select>
                        </div>
                        </FormControl>
                    </div>
                    </div>


                    <div className="">
                        <DateRangeFilter
                            fromValue={listState.filters.from}
                            toValue={listState.filters.to}
                            onFromChange={(v) => setFilter('from', v)}
                            onToChange={(v) => setFilter('to', v)}
                            size="small"
                        />
                    </div>
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
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-10 text-[#666666]">No appointments found.</div>
            ) : (
                        <Table sx={{ minWidth: '100%', borderCollapse: 'collapse', bgcolor: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
                            <TableHead sx={{ position: 'sticky', top: 0, bgcolor: '#fff' }}>
                                <TableRow sx={{ bgcolor: '#003995' }}>
                                    {['Sr No', 'Legal Expert Name', 'Client Name', 'Location', 'Mode', 'Appointment date', 'Appointment Time'].map((label) => (
                                        <TableCell
                                            key={label}
                                            sx={{
                                                px: 2,
                                                py: 1,
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
                                {appointments.map((appointment, index) => {
                                    const isLastRow = index === appointments.length - 1;
                                    const cellSx = {
                                        px: 2,
                                        py: 1,
                                        fontWeight: 400,
                                        borderBottom: isLastRow ? 'none' : '1px solid #e5e7eb',
                                    };
                                    return (
                                        <TableRow key={appointment.id}>
                                            <TableCell sx={cellSx}>{index + 1}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{appointment.legalExpertName}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{appointment.clientName}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{appointment.location}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{appointment.mode}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{appointment.appointmentDate}</TableCell>
                                            <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{appointment.appointmentTime}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
            )}
                    </TableContainer>
                    {appointmentsMeta && appointmentsMeta.totalCount > 0 && (
                        <ListFooterPager
                            page={listState.page}
                            pageSize={listState.pageSize}
                            totalCount={appointmentsMeta.totalCount}
                            totalPages={appointmentsMeta.totalPages}
                            hasNextPage={appointmentsMeta.hasNextPage}
                            hasPreviousPage={appointmentsMeta.hasPreviousPage}
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
