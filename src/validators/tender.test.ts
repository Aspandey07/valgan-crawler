import { describe, it, expect } from 'vitest';
import { searchTendersQuerySchema } from '../../src/validators/tender';

describe('Tender Validator', () => {
  it('should parse valid search query', () => {
    const query = {
      q: 'test',
      page: '2',
      limit: '10',
    };
    
    const parsed = searchTendersQuerySchema.parse(query);
    expect(parsed.q).toBe('test');
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(10);
    expect(parsed.sortBy).toBe('createdAt');
    expect(parsed.sortOrder).toBe('desc');
  });

  it('should fallback to defaults', () => {
    const parsed = searchTendersQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(20);
  });
});
