import { describe, expect, it } from 'vitest';
import {
  COMMONPLACE_PAGE_SIZE,
  getCommonplacePageCount,
  getCommonplacePageEntries,
} from '@/lib/commonplace';

describe('Commonplace pagination', () => {
  it('uses fifty entries per page', () => {
    const entries = Array.from({ length: COMMONPLACE_PAGE_SIZE + 1 }, (_, index) => ({
      id: String(index),
    })) as never[];

    expect(getCommonplacePageEntries(entries, 1)).toHaveLength(COMMONPLACE_PAGE_SIZE);
    expect(getCommonplacePageEntries(entries, 2)).toHaveLength(1);
  });

  it('calculates at least one page for an empty archive', () => {
    expect(getCommonplacePageCount(0)).toBe(1);
    expect(getCommonplacePageCount(51)).toBe(3);
  });
});
