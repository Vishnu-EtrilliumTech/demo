import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Chip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { fetchCaseSummary } from '@/app/organization/services/api';
import { CaseSummary } from '@/app/organization/types';
import { formatDisplayDateTime } from '@/utils';
import styles from './CaseSummarySection.module.css';

interface CaseSummarySectionProps {
  caseId: string;
  siteId: string;
  organizationId: string;
}

// Helper function to check if AI features are enabled for this organization
const isAIEnabledForOrganization = (organizationId: string): boolean => {
  const enabledOrgIds = process.env.NEXT_PUBLIC_AI_ENABLED_ORG_IDS || '';
  const enabledIds = enabledOrgIds.split(',').map(id => id.trim());
  return enabledIds.includes(organizationId);
};

export const CaseSummarySection: React.FC<CaseSummarySectionProps> = ({
  caseId,
  siteId,
  organizationId,
}) => {
  // All hooks must be called before any conditional returns
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Check if AI is enabled for this organization
  const aiEnabled = isAIEnabledForOrganization(organizationId);

  // Don't render anything if AI is not enabled for this organization
  if (!aiEnabled) {
    return null;
  }

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCaseSummary(organizationId, siteId, caseId);
      setSummary(data);
      setExpanded(true);
    } catch (err: unknown) {
      console.error('Error fetching case summary:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={styles.summaryCard} sx={{ borderRadius: '16px', mb: 2 }}>
      <CardContent className={styles.summaryContent}>
        <Box className={styles.summaryHeader}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoAwesomeIcon sx={{ color: '#9c27b0', fontSize: 28 }} />
            <Typography variant="h6" component="h2" className={styles.summaryTitle}>
              AI-Powered Case Summary
            </Typography>
            <Chip
              label="Beta"
              size="small"
              sx={{
                bgcolor: 'rgba(156, 39, 176, 0.1)',
                color: '#9c27b0',
                fontWeight: 600,
                fontSize: '0.7rem',
              }}
            />
          </Box>
          {summary && (
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              sx={{
                bgcolor: 'rgba(156, 39, 176, 0.08)',
                '&:hover': {
                  bgcolor: 'rgba(156, 39, 176, 0.15)',
                },
              }}
            >
              {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </Box>

        {!summary && !loading && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Generate an AI-powered comprehensive summary of this case including case overview, key parties, current status, task progress, upcoming deadlines, and financial information.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleGenerateSummary}
              startIcon={<AutoAwesomeIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                borderRadius: '16px',
                px: 3,
                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7b1fa2 0%, #6a1b9a 100%)',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)',
                },
              }}
            >
              Generate Summary
            </Button>
          </>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: '#9c27b0', mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Generating AI-powered summary... This may take a few moments.
            </Typography>
          </Box>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: '#d32f2f',
              },
            }}
          >
            {error}
          </Alert>
        )}

        {summary && (
          <Collapse in={expanded}>
            <Box className={styles.summaryContentBox}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Generated on {formatDisplayDateTime(summary.generatedAt)}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleGenerateSummary}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={14} /> : <AutoAwesomeIcon />}
                  sx={{
                    textTransform: 'none',
                    borderRadius: '12px',
                    ml: 'auto',
                    fontSize: '0.75rem',
                    py: 0.5,
                    px: 1.5,
                    borderColor: '#9c27b0',
                    color: '#9c27b0',
                    '&:hover': {
                      borderColor: '#7b1fa2',
                      bgcolor: 'rgba(156, 39, 176, 0.04)',
                    },
                  }}
                >
                  Regenerate
                </Button>
              </Box>

              <Box className={styles.markdownContent}>
                <ReactMarkdown>{summary.summary}</ReactMarkdown>
              </Box>
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};
