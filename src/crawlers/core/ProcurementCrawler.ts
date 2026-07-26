import { Tender } from '@prisma/client';

export interface ProcurementCrawler {
  portalName: string;
  crawlListings(): Promise<Partial<Tender>[]>;
  crawlTenderDetails(tender: Partial<Tender>): Promise<Partial<Tender>>;
  downloadDocument(url: string, tenderId: string): Promise<{ localPath: string; hash: string } | null>;
  normalizeTender(data: Partial<Tender>): Partial<Tender>;
  run(): Promise<void>;
}
