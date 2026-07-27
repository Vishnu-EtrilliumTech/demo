"use client";

import React from "react";
import { Avatar, AvatarGroup, Box, ButtonBase, CircularProgress, Tooltip, Typography } from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { CaseContributor } from "@/app/organization/types/caseindex";
import { colorForName, initialsForName } from "./contributorColors";

export interface ContributorsHeaderIndicatorProps {
  contributors: CaseContributor[];
  loading: boolean;
  /** Jumps the user to the Overview tab where the full Contributors card lives. */
  onClick: () => void;
}

const MAX_AVATARS = 4;

export const ContributorsHeaderIndicator: React.FC<ContributorsHeaderIndicatorProps> = ({
  contributors,
  loading,
  onClick,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <CircularProgress size={16} />
      </Box>
    );
  }

  const names = contributors.map((c) => c.userFullName).join(", ");

  return (
    <Tooltip
      title={
        contributors.length > 0
          ? `Contributors: ${names}`
          : "No contributors yet — manage from the Overview tab"
      }
    >
      <ButtonBase
        onClick={onClick}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1,
          py: 0.5,
          minHeight: 33,
          boxSizing: "border-box",
          borderRadius: "20px",
          border: "1px solid rgba(25, 118, 210, 0.2)",
          "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.06)" },
        }}
      >
        <GroupAddIcon sx={{ fontSize: 16, color: "text.secondary" }} />
        {contributors.length > 0 ? (
          <AvatarGroup
            max={MAX_AVATARS}
            sx={{
              "& .MuiAvatar-root": {
                width: 24,
                height: 24,
                fontSize: "0.65rem",
                fontWeight: 600,
                border: "2px solid #fff",
              },
            }}
          >
            {contributors.map((contributor) => {
              const color = colorForName(contributor.userFullName);
              return (
                <Avatar
                  key={contributor.id}
                  sx={{ bgcolor: color, color: "#fff" }}
                >
                  {initialsForName(contributor.userFullName)}
                </Avatar>
              );
            })}
          </AvatarGroup>
        ) : (
          <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
            No contributors
          </Typography>
        )}
      </ButtonBase>
    </Tooltip>
  );
};

export default ContributorsHeaderIndicator;
