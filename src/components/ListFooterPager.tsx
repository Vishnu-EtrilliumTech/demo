"use client";

import React from "react";
import {
  Box,
  FormControl,
  MenuItem,
  Pagination,
  Select,
  type SelectChangeEvent,
  Typography,
} from "@mui/material";

// Shared, consistent footer pager for every in-scope list view.
// See specs/035-pagination-sorting-filtering/contracts/frontend-contracts.md §4.

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

export interface ListFooterPagerProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  /** True while fetching — greys out controls (FR-019). */
  disabled?: boolean;
}

/**
 * Renders a numbered MUI `<Pagination>`, a page-size `<Select>`, and a
 * "{from}–{to} of {totalCount}" range label.
 *
 * The component is presentational: it emits `onPageChange`/`onPageSizeChange`
 * only. The page-1 reset on a size change is owned by `useListQuery`, not here.
 */
export function ListFooterPager({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: ListFooterPagerProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    onPageChange(value);
  };

  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    onPageSizeChange(Number(event.target.value));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        mt: 2,
        pt: 1.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {from}–{to} of {totalCount.toLocaleString()}
        </Typography>
        <FormControl size="small" disabled={disabled}>
          <Select
            value={pageSize}
            onChange={handlePageSizeChange}
            aria-label="Rows per page"
            sx={{
              borderRadius: "20px",
              fontSize: "0.875rem",
              bgcolor: "#fafafa",
              minWidth: 92,
            }}
          >
            {pageSizeOptions.map((opt) => (
              <MenuItem key={opt} value={opt} sx={{ fontSize: "0.875rem" }}>
                {opt} / page
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Pagination
        count={Math.max(totalPages, 1)}
        page={page}
        onChange={handlePageChange}
        disabled={disabled}
        shape="rounded"
        size="small"
        // Reinforce the wire-level edges from the response metadata (FR-006):
        // hide prev on the first page and next on the last page.
        hidePrevButton={!hasPreviousPage}
        hideNextButton={!hasNextPage}
        sx={{
          "& .MuiPaginationItem-root": { fontWeight: 600, fontSize: "0.8rem" },
          "& .MuiPaginationItem-root.Mui-selected": {
            bgcolor: "#3b82f6",
            color: "white",
            "&:hover": { bgcolor: "#2563eb" },
          },
        }}
      />
    </Box>
  );
}

export default ListFooterPager;
