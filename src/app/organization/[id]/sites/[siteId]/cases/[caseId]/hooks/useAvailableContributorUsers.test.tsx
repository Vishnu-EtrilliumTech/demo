import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAvailableContributorUsers } from './useAvailableContributorUsers';
import { fetchAvailableContributorUsers } from '@/app/organization/services/caseapi';
import { AvailableUser } from '@/app/organization/types/caseindex';
import type { PagedResponse } from '@/types/pagination';

vi.mock('@/app/organization/services/caseapi', () => ({
  fetchAvailableContributorUsers: vi.fn(),
}));

const mockFetch = vi.mocked(fetchAvailableContributorUsers);

const sample: AvailableUser[] = [
  { id: '11111111-1111-1111-1111-111111111111', fullName: 'Alice Member', email: 'alice@example.com' },
  { id: '22222222-2222-2222-2222-222222222222', fullName: 'Bob Member', email: 'bob@example.com' },
];

/** Wrap a list of users in the paged envelope the migrated accessor now returns. */
const page = (items: AvailableUser[]): PagedResponse<AvailableUser> => ({
  items,
  totalCount: items.length,
  page: 1,
  pageSize: 20,
  totalPages: items.length === 0 ? 0 : 1,
  hasNextPage: false,
  hasPreviousPage: false,
});

describe('useAvailableContributorUsers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('loads the eligible users on mount when enabled', async () => {
    mockFetch.mockResolvedValue(page(sample));

    const { result } = renderHook(() =>
      useAvailableContributorUsers('1', '3', '12', true)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).toHaveBeenCalledWith('1', '3', '12');
    expect(result.current.availableUsers).toEqual(sample);
  });

  it('does not fetch when disabled (view-only users)', async () => {
    const { result } = renderHook(() =>
      useAvailableContributorUsers('1', '3', '12', false)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockFetch).not.toHaveBeenCalled();
    expect(result.current.availableUsers).toEqual([]);
  });

  it('refetch re-loads the list', async () => {
    mockFetch.mockResolvedValueOnce(page(sample)).mockResolvedValueOnce(page([sample[0]]));

    const { result } = renderHook(() =>
      useAvailableContributorUsers('1', '3', '12', true)
    );

    await waitFor(() => expect(result.current.availableUsers).toEqual(sample));

    await act(async () => {
      await result.current.refetch();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.current.availableUsers).toEqual([sample[0]]);
  });

  it('falls back to an empty list when the fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() =>
      useAvailableContributorUsers('1', '3', '12', true)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.availableUsers).toEqual([]);
  });
});
