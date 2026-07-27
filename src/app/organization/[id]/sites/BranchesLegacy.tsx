'use client';

import { useState } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SiteManagementTab from '../../components/SiteManagementTab';
import AddSiteModal from '@/components/modals/AddSiteModal';
import { useHasScrollbar } from '@/hooks/useHasScrollbar';

export default function BranchesLegacy({ orgId }: { orgId: string }) {
  const hasScrollbar = useHasScrollbar();
  const id = orgId;
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <Box sx={{ pl: { xs: 2, sm: 3 }, pr: { xs: 2, sm: hasScrollbar ? 4 : 5 }, py:3 } }>
      {/* Page Header */}
      <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexWrap: 'wrap',
                gap: 1.5,
                background: 'linear-gradient(135deg, rgba(20,184,166,0.08) 0%, rgba(59,130,246,0.05) 100%)',
                borderRadius: '16px',
                p: '16px 20px',
                mb: 3,
              }}
            >
        <Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}
          >
            Sites
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage all sites in your organization
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddModalOpen(true)}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 2.5,
            py: 1,
            bgcolor: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            '&:hover': {
              bgcolor: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              boxShadow: '0 4px 12px rgba(217,119,6,0.35)',
            },
          }}
        >
          Add Site
        </Button>
      </Box>

<Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          // p: '16px 20px',
          background: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
      {/* Sites list — same logic as dashboard Sites tab */}
      <SiteManagementTab
        organizationId={id}
        hideAddButton
        refreshKey={refreshKey}
      />

      {/* Add Site Modal — triggered from page header button */}
      <AddSiteModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => { setAddModalOpen(false); setRefreshKey(k => k + 1); }}
        organizationId={id}
      />
      </Paper>
    </Box>
  );
}
