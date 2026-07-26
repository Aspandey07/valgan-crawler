import { describe, it, expect } from 'vitest';
import { UKContractsFinder } from './UKContractsFinder';

describe('UKContractsFinder', () => {
  const crawler = new UKContractsFinder();

  it('should normalize tender correctly', () => {
    const rawData = {
      title: 'Test Tender',
      detailUrl: 'https://test.com/123',
      tenderId: '123',
    };

    const normalized = crawler.normalizeTender(rawData);

    expect(normalized.title).toBe('Test Tender');
    expect(normalized.portalName).toBe('UK Contracts Finder');
    expect(normalized.status).toBe('PROCESSED');
    expect(normalized.tenderId).toBe('123');
  });
});
