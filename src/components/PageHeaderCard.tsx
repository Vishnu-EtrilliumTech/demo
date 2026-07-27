"use client";

import React from "react";
import { Box, Button, Card, Collapse, Typography } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface PageHeaderCardProps {
  /** Icon (or image) rendered inside the accent box on the left of the title. */
  icon: React.ReactNode;
  title: React.ReactNode;
  /** Plain-text title used for the native tooltip; falls back to nothing if title isn't a string. */
  titleText?: string;
  description: React.ReactNode;
  /** Extra controls rendered before the Show/Hide Details button (e.g. Quick Actions, Link CNR). */
  actions?: React.ReactNode;
  /** Collapsible details content. Omit to render the header without an expand/collapse control. */
  children?: React.ReactNode;
  expanded?: boolean;
  onToggleExpanded?: () => void;
}

/**
 * Shared page-header card used by the Organization, Site, and Case detail
 * pages so the three headers stay pixel-consistent (spacing, gradient title,
 * icon treatment, and responsive breakpoints all match the Case header).
 */
export function PageHeaderCard({
  icon,
  title,
  titleText,
  description,
  actions,
  children,
  expanded = false,
  onToggleExpanded,
}: PageHeaderCardProps) {
  return (
    <Card
      sx={{
        mb: 3,
        borderRadius: "16px",
        boxShadow: "0 4px 24px rgba(25, 118, 210, 0.15)",
        overflow: "hidden",
        border: "1px solid rgba(25, 118, 210, 0.1)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: { xs: "wrap", lg: "nowrap" },
          justifyContent: "space-between",
          alignItems: "center",
          p: { xs: "10px 12px", sm: "16px 20px" },
          gap: 1,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "flex-start",
            gap: { xs: 1, sm: 1.5, md: 2 },
            width: { xs: "100%", lg: "auto" },
            minWidth: { xs: "100%", sm: 220 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: { xs: 44, sm: 56, md: 72 },
              height: { xs: 44, sm: 56, md: 72 },
              mt: { xs: 0.5, md: 0 },
              background: "#1a1f36",
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 600,
                background:
                  "linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                lineHeight: { xs: 1.3, sm: 1.2 },
                letterSpacing: "-0.01em",
                mb: { xs: 0.25, sm: 1 },
                fontSize: {
                  xs: "1.1rem",
                  sm: "1.25rem",
                  md: "1.5rem",
                  lg: "1.75rem",
                },
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: { xs: "nowrap", sm: "normal" },
                wordBreak: { xs: "normal", sm: "break-word" },
                maxWidth: "100%",
                alignSelf: "flex-start",
              }}
              title={titleText}
            >
              {title}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "text.secondary",
                fontWeight: 400,
                letterSpacing: "0.01em",
                lineHeight: 1.4,
                fontSize: { xs: "0.85rem", sm: "0.95rem", md: "1rem" },
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                maxWidth: { xs: "100%", lg: "450px" },
              }}
            >
              {description}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          {actions}
          {onToggleExpanded && (
            <Button
              variant="outlined"
              size="small"
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={onToggleExpanded}
              sx={{
                borderRadius: "20px",
                textTransform: "none",
                borderColor: "rgba(25, 118, 210, 0.35)",
                color: "primary.main",
                flexShrink: 0,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                px: { xs: 1.5, sm: 2 },
                "&:hover": {
                  borderColor: "primary.main",
                  backgroundColor: "rgba(25, 118, 210, 0.06)",
                },
              }}
            >
              {expanded ? "Hide Details" : "Show Details"}
            </Button>
          )}
        </Box>
      </Box>

      {children && (
        <Collapse in={expanded}>
          <Box sx={{ p: 2 }}>{children}</Box>
        </Collapse>
      )}
    </Card>
  );
}
