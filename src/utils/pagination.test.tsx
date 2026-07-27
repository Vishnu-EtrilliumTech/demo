import { describe, it, expect } from 'vitest';
import { buildListParams } from './pagination';
import type { ListQueryState } from '@/types/pagination';

interface SampleFilters extends Record<string, unknown> {
  status?: string;
  siteId?: number;
  search?: string;
  archived?: boolean;
  tags?: string[];
}

const baseState = (
  overrides: Partial<ListQueryState<SampleFilters>> = {},
): ListQueryState<SampleFilters> => ({
  page: 1,
  pageSize: 20,
  filters: {},
  ...overrides,
});

describe('buildListParams', () => {
  it('always passes through page and pageSize', () => {
    const params = buildListParams(baseState({ page: 3, pageSize: 50 }));
    expect(params.page).toBe(3);
    expect(params.pageSize).toBe(50);
  });

  it('omits sortBy/sortDirection when no sort is chosen (backend default applies)', () => {
    const params = buildListParams(baseState());
    expect(params).not.toHaveProperty('sortBy');
    expect(params).not.toHaveProperty('sortDirection');
  });

  it('passes through an active sort', () => {
    const params = buildListParams(
      baseState({ sortBy: 'createdDate', sortDirection: 'desc' }),
    );
    expect(params.sortBy).toBe('createdDate');
    expect(params.sortDirection).toBe('desc');
  });

  it('omits sortDirection when sortBy is set without a direction', () => {
    const params = buildListParams(baseState({ sortBy: 'name' }));
    expect(params.sortBy).toBe('name');
    expect(params).not.toHaveProperty('sortDirection');
  });

  it('passes through active filter values', () => {
    const params = buildListParams(
      baseState({ filters: { status: 'open', siteId: 7, search: 'smith' } }),
    );
    expect(params.status).toBe('open');
    expect(params.siteId).toBe(7);
    expect(params.search).toBe('smith');
  });

  it('omits undefined, null, empty-string, whitespace, and empty-array filter values', () => {
    const params = buildListParams(
      baseState({
        filters: {
          status: undefined,
          search: '   ',
          tags: [],
        } as SampleFilters,
      }),
    );
    expect(params).not.toHaveProperty('status');
    expect(params).not.toHaveProperty('search');
    expect(params).not.toHaveProperty('tags');
  });

  it('preserves meaningful falsy filter values (0 and false)', () => {
    const params = buildListParams(
      baseState({ filters: { siteId: 0, archived: false } }),
    );
    expect(params.siteId).toBe(0);
    expect(params.archived).toBe(false);
  });

  it('preserves explicit page/pageSize alongside active filters and sort', () => {
    const params = buildListParams(
      baseState({
        page: 2,
        pageSize: 100,
        sortBy: 'title',
        sortDirection: 'asc',
        filters: { status: 'closed' },
      }),
    );
    expect(params).toMatchObject({
      page: 2,
      pageSize: 100,
      sortBy: 'title',
      sortDirection: 'asc',
      status: 'closed',
    });
  });
});
