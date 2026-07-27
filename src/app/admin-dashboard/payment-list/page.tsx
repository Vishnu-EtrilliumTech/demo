/* eslint-disable */
'use client'

import {
    Autocomplete,
    FormControl,
    InputAdornment,
    MenuItem,
    Select,
    SelectChangeEvent,
    Stack,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from "@mui/material";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import Image from "next/image";
import Datepicker, { DateValueType } from "react-tailwindcss-datepicker";
import type { PaymentListItem } from '@/app/admin-dashboard/services/types';
import { useListQuery } from '@/hooks/useListQuery';

const top100Films = [
    { title: 'Afsal Mohammad'},
    { title: 'Amal' },
    { title: 'Mohammad'},
];

export default function PaymentPage() {

    const [filterLocation, setFilterLocation] = useState('All');
    const handleLocationChange = (event: SelectChangeEvent) => {
                setFilterLocation(event.target.value);
            };
    const CustomMenuItem = styled(MenuItem)(({ theme }) => ({
                borderBottom: '1px solid #D4D4D4',
                '&:last-child': {
                    borderBottom: 'none',
                },
            }));
            // Orders / payment-settlement lists are id-scoped (orders/legalexperts/{id},
            // paymentsettlements/legalexperts/{id}); the service functions live in
            // admin-dashboard/services/api.ts and are consumed wherever an expert/client context
            // exists. This global admin view starts empty until that context is available.
            const [paymentData, setPaymentData] = useState<PaymentListItem[]>([]);
               const [value, setValue] = useState<DateValueType>({
                      startDate: null,
                      endDate: null
                  });
                const [isLoading, setIsLoading] = useState(true)
                const { state: listState, setSort, clearSort } = useListQuery({
                    defaultSort: { sortBy: 'paymentDate', sortDirection: 'desc' },
                    sortableFields: ['paymentDate', 'clientName', 'amount'],
                    filterKeys: [],
                });
                useEffect(() => {
                    setIsLoading(false);
                    }, []);


    return (
        <div className={styles.appointmentContainer}>
            <div className="flex flex-col text-center">
                <p className="font-bold text-[40px] text-[#222222]">Payments</p>
            </div>

            <div className="p-3">

               <div className="bg-white rounded-[16px] border-white-300 p-[10px]">
               <div className="flex flex-col lg:flex-row gap-4 w-full justify-end">
                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">

                    <div className="w-full sm:w-[280px]">
                    <Stack spacing={1} sx={{ width: 280 }}>
                    <Autocomplete freeSolo id="rounded-search" disableClearable options={top100Films.map((option) => option.title)} renderInput={(params) => (
                        <TextField {...params} placeholder="Transaction Reference"
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    height: 46,
                                    borderRadius: '50px',
                                    paddingLeft: '14px',
                                '& fieldset': {
                                    borderColor: '#ccc',
                                    },
                                '&:hover fieldset': {
                                    borderColor: '#aaa',
                                    },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#3f51b5',
                                    },
                                },
                                '& .MuiInputAdornment-root': {
                                    marginRight: '8px',
                                }
                            }}
                            InputProps={{
                                ...params.InputProps,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon />
                                    </InputAdornment>
                                ),
                                 type: 'search',
                                    sx: {
                                         height: '100%',
                                    }
                            }}
                            variant="outlined"
                        />
                    )} />
                    </Stack>
                    </div>


                    <div className="w-full ">
                    <FormControl variant="outlined" sx={{ minWidth: 134}}>
                        <div className="flex items-center gap-2">
                        <Typography>Status:</Typography>
                            <Select
                                value={filterLocation}
                                onChange={handleLocationChange}
                                sx={{
                                    width:'134px',
                                    borderRadius: '48px',
                                    '& .MuiSelect-select': {
                                        padding: '10px 32px 10px 14px',
                                    },
                                    '& fieldset': {
                                        borderColor: '#33333351',
                                    },
                                }}
                            >
                                <CustomMenuItem value="All">All</CustomMenuItem>
                                <CustomMenuItem value="Success">Success</CustomMenuItem>
                                <CustomMenuItem value="Failed">Failed</CustomMenuItem>
                            </Select>
                        </div>
                        </FormControl>
                    </div>
                    <div>
                        <FormControl variant="outlined" sx={{ minWidth: 134 }}>
                        <div className="flex items-center gap-2">
                        <Typography>Sort:</Typography>
                        <Select
                            displayEmpty
                            value={listState.sortBy ? `${listState.sortBy}:${listState.sortDirection ?? 'desc'}` : ''}
                            onChange={(e: SelectChangeEvent) => {
                                const val = e.target.value;
                                if (!val) { clearSort(); return; }
                                const [field, dir] = val.split(':');
                                setSort(field, dir as 'asc' | 'desc');
                            }}
                            sx={{ minWidth: 150, borderRadius: '20px', fontSize: '0.875rem', bgcolor: '#fafafa' }}
                        >
                            <CustomMenuItem value="">Default</CustomMenuItem>
                            <CustomMenuItem value="paymentDate:desc">Date ↓</CustomMenuItem>
                            <CustomMenuItem value="paymentDate:asc">Date ↑</CustomMenuItem>
                            <CustomMenuItem value="clientName:asc">Client A→Z</CustomMenuItem>
                            <CustomMenuItem value="amount:desc">Amount ↓</CustomMenuItem>
                        </Select>
                        </div>
                        </FormControl>
                    </div>
                    </div>


                    <div >
                        <div className="flex items-center gap-2">
                            <Typography className="whitespace-nowrap text-sm sm:text-base">
                                Period:
                            </Typography>
                            <div className="relative ">
                                <Datepicker separator="➞" value={value} primaryColor="indigo" displayFormat="DD-MM-YYYY" onChange={newValue => setValue(newValue)} showShortcuts={true}
                                    configs={{
                                        shortcuts: {
                                            today: "Today",
                                            yesterday: "Yesterday",
                                            next7Days: {
                                                text: "This Week",
                                                period: {
                                                    start: new Date(new Date().setDate(new Date().getDate() + 1)),
                                                    end: new Date(new Date().setDate(new Date().getDate() + 7))
                                                }
                                            },
                                            last7Days: {
                                                text: "Last Week",
                                                period: {
                                                    start: new Date(new Date().setDate(new Date().getDate() - 7)),
                                                    end: new Date(new Date().setDate(new Date().getDate() - 1))
                                                }
                                            },
                                            currentMonth: "This Month",
                                            pastMonth: "Last Month",
                                            next365Days: {
                                                text: "This Year",
                                                period: {
                                                    start: new Date(new Date().setDate(new Date().getDate() + 0)),
                                                    end: new Date(new Date().setDate(new Date().getDate() + 365))
                                                }
                                            },
                                            last365Days: {
                                                text: "Last Year",
                                                period: {
                                                    start: new Date(new Date().setDate(new Date().getDate() - 365)),
                                                    end: new Date(new Date().setDate(new Date().getDate() - 0))
                                                }
                                            }
                                        }
                                    }}
                                toggleClassName="hidden"
                                popoverDirection="down"
                                placeholder="From Date - To Date"
                                inputClassName="bg-white border border-gray-300 rounded-full h-[46px] px-4 focus:ring-[#002A6A] focus:border-[#002A6A] w-full pr-10" />
                                <Image src="/periodCalendar.svg" alt="calendar" width={20} height={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
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
            ) : paymentData.length === 0 ? (
                <div className="text-center py-10 text-[#666666]">No payments found.</div>
            ) : (
                    <Table sx={{ minWidth: '100%', borderCollapse: 'collapse', bgcolor: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
                                <TableHead sx={{ position: 'sticky', top: 0, bgcolor: '#fff' }}>
                                    <TableRow sx={{ bgcolor: '#003995' }}>
                                        {['Sr No', 'Date', 'Client Name', 'Transaction Reference', 'Amount', 'Status', 'Download Invoice'].map((label) => (
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
                                    {paymentData.map((payment, index) => {
                                        const isLastRow = index === paymentData.length - 1;
                                        const cellSx = {
                                            px: 2,
                                            py: 1,
                                            fontWeight: 400,
                                            borderBottom: isLastRow ? 'none' : '1px solid #e5e7eb',
                                        };
                                        return (
                                            <TableRow key={payment.id}>
                                                <TableCell sx={cellSx}>{index + 1}</TableCell>
                                                <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{payment.date}</TableCell>
                                                <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{payment.clientName}</TableCell>
                                                <TableCell sx={{ ...cellSx, textTransform: 'capitalize' }}>{payment.transactionReference}</TableCell>
                                                <TableCell sx={cellSx}>{payment.amount}</TableCell>
                                                <TableCell sx={cellSx}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", textTransform: "capitalize" }}>
                                                        <span style={{borderRadius: "50%",width: "12px",height: "12px",backgroundColor: payment.status === "Failed" ? "#EA4234" : "#25FF02",}}></span>{payment.status}
                                                    </div>
                                                </TableCell>
                                                <TableCell sx={cellSx}>
                                                    {payment.status === "Failed" ? (
                                                        <Image src="/downloadInvoice.svg" alt="invoice" width={24} height={24} className="opacity-50 cursor-not-allowed"  onClick={(e) => e.preventDefault()} />
                                                    ) : (
                                                        <Image src="/downloadInvoice.svg" alt="invoice" width={24}  height={24} className="cursor-pointer hover:opacity-80"  onClick={() => { console.log("Downloading invoice for:", payment.id); }} />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
            )}
            </TableContainer>
               </div>
            </div>
        </div>
    );
}
