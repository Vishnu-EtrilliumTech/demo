'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
} from '@mui/material';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import { fetchOrganizationSites } from '../services/api';
import { Site } from '../types';
import type { SiteListFilters } from '../types/listFilterTypes';
import { Select, type SelectChangeEvent } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import SortIcon from '@mui/icons-material/Sort';
import { TextSearchFilter } from '@/components/filters';
import { classifyListError } from '@/utils/errorHandler';
import {
  LocationOn as LocationOnIcon,
  LocationCity as LocationCityIcon,
  MailOutline as MailOutlineIcon,
  Phone as PhoneIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import dynamic from 'next/dynamic';

const SitesTable = dynamic(() => import('./SitesTable'), { ssr: false });
import AddSiteModal from '@/components/modals/AddSiteModal';
import { useToast } from '@/contexts/ToastContext';
import { useListQuery } from '@/hooks/useListQuery';
import ListFooterPager from '@/components/ListFooterPager';
import type { PagedResponse } from '@/types/pagination';

interface SiteManagementTabProps {
  organizationId: string;
  organizationName?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  hideAddButton?: boolean;
  refreshKey?: number;
}

export default function SiteManagementTab({
  organizationId,
  hideAddButton = false,
  refreshKey = 0,
}: SiteManagementTabProps) {
  const { params: listParams, state: listState, setPage, setPageSize, setSort, clearSort, setFilter, clearFilters } =
    useListQuery<SiteListFilters>({
      defaultSort: { sortBy: 'name', sortDirection: 'asc' },
      sortableFields: ['name', 'createdDate', 'status'],
      filterKeys: ['search'],
    });
  const [sitesMeta, setSitesMeta] = useState<PagedResponse<Site> | null>(null);
  const [allSites, setAllSites] = useState<Site[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { showError } = useToast();

  const fetchSites = useCallback(async () => {
    if (!organizationId) return;
    setIsLoadingSites(true);
    setError(null);
    try {
      const sitesPage = await fetchOrganizationSites(organizationId, listParams);
      setAllSites(sitesPage.items);
      setSitesMeta(sitesPage);
    } catch (err) {
      const info = classifyListError(err);
      if (info.kind === 'invalid-filter') {
        showError(info.messages[0] ?? 'Invalid filter — please adjust and try again.');
      } else if (info.kind === 'forbidden') {
        setError('You do not have permission to view sites for this organization.');
        setAllSites([]);
      } else if (info.kind === 'auth') {
        setError('Session expired — please refresh the page.');
        setAllSites([]);
      } else {
        console.error('Error fetching sites:', err);
        setError('Failed to load sites.');
        setAllSites([]);
      }
    } finally {
      setIsLoadingSites(false);
    }
  }, [organizationId, listParams, showError]);

  useEffect(() => {
    fetchSites();
  }, [fetchSites, refreshKey]);

  const handleAddSite = () => setAddModalOpen(true);

  const handleViewSite = (site: Site) => {
    if (!site.id) return;
    router.push(`/organization/${organizationId}/sites/${site.id}`);
  };

  const formatAddress = (site: Site) => {
    let parts = [site.address, site.locality, site.district, site.state];
    parts = parts.filter(Boolean); 
    let addressString = parts.join(', ');
    if (site.pincode) {
      addressString += ` - ${site.pincode}`;
    }
    return addressString;
  };

  if (!organizationId) {
    return <Typography sx={{p:2, textAlign:'center'}}>Organization not selected.</Typography>;
  }

  return (
    <Paper elevation={0} sx={{ p: {xs: 1, sm: 2}, borderRadius: '16px', background: 'transparent' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', flex: 1 }}>
          <TextSearchFilter
            placeholder="Search sites by name…"
            value={listState.filters.search}
            onChange={(v) => setFilter('search', v)}
            disabled={isLoadingSites}
          />
          {listState.filters.search && (
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
              onClick={handleAddSite}
              startIcon={<AddIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: '16px',
                px: 2,
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }
              }}
            >
              Add Site
            </Button>
          )}
        </Box>
      </Box>

      {isLoadingSites ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /><Typography sx={{ml:1}}>Loading sites...</Typography></Box>
      ) : error ? (
        <Typography color="error" sx={{p:2, textAlign:'center'}}>{error}</Typography>
      ) : allSites.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <SearchOffIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No sites found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {listState.filters.search ? 'Try adjusting your search or filter to find what you\'re looking for.' : 'No sites found for this organization.'}
          </Typography>
        </Box>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={3}>
          {allSites.map((site, index) => {
            const avatarBgColors = ['#e8eaf6', '#e0f2f1', '#f3e5f5', '#e3f2fd', '#fce4ec', '#e8f5e9'];
            const avatarIconColors = ['#5c6bc0', '#26a69a', '#7e57c2', '#42a5f5', '#ef5350', '#66bb6a'];
            const avatarBg = avatarBgColors[index % avatarBgColors.length];
            const avatarIcon = avatarIconColors[index % avatarIconColors.length];
            return (
              <Grid item xs={12} sm={6} md={4} key={`site-grid-${site.id}-${index}`}>
                <Card
                  onClick={() => handleViewSite(site)}
                  sx={{
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '16px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    border: '1px solid #f1f5f9',
                    '&:hover': {
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      borderColor: '#e2e8f0',
                      '& .site-card-name': { color: '#3b82f6' },
                    },
                  }}
                >
                  <Box display="flex" alignItems="center" p={2}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: avatarBg, mr: 1.5 }}>
                      <LocationCityIcon fontSize="small" sx={{ color: avatarIcon }} />
                    </Avatar>
                    <Box flexGrow={1} sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        noWrap
                        title={site.name}
                        className="site-card-name"
                        sx={{ fontWeight: 600, fontSize: '1rem', transition: 'color 0.2s ease' }}
                      >
                        {site.name}
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ flexGrow: 1, pt: 0 }}>
                    <Box display="flex" alignItems="center" mb={0.5}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary" noWrap title={formatAddress(site)}>{formatAddress(site)}</Typography>
                    </Box>
                    {site.emailId && (
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <MailOutlineIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="textSecondary" noWrap title={site.emailId}>{site.emailId}</Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" mb={1}>
                      <PhoneIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="textSecondary">{site.phoneNumber}</Typography>
                    </Box>
                    {site.siteKey && (
                      <Box display="flex" alignItems="center" mb={0.5}>
                        <VpnKeyIcon sx={{ fontSize: 14, color: '#94a3b8', mr: 1, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500 }}>{site.siteKey}</Typography>
                      </Box>
                    )}
                    {site.description && (
                      <Typography
                        variant="body2"
                        display="block"
                        sx={{
                          fontStyle: 'italic',
                          color: '#5c7a6b',
                          maxHeight: '40px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mt: 0.5,
                        }}
                      >
                        {site.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : viewMode === 'table' ? (
        <SitesTable
          sites={allSites}
          onRowClick={(site) => handleViewSite(site)}
          sortBy={listState.sortBy}
          sortDirection={listState.sortDirection}
          onSort={setSort}
          onClearSort={clearSort}
        />
      ) : null}

      {!isLoadingSites && !error && sitesMeta && sitesMeta.totalCount > 0 && (
        <ListFooterPager
          page={listState.page}
          pageSize={listState.pageSize}
          totalCount={sitesMeta.totalCount}
          totalPages={sitesMeta.totalPages}
          hasNextPage={sitesMeta.hasNextPage}
          hasPreviousPage={sitesMeta.hasPreviousPage}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={isLoadingSites}
        />
      )}

      {/* Add Site Modal */}
      <AddSiteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { setAddModalOpen(false); fetchSites(); }}
        organizationId={organizationId}
      />

    </Paper>
  );
}
