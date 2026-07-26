import * as cheerio from 'cheerio';
import { ProcurementCrawler } from '../core/ProcurementCrawler';
import { Tender, Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';
import { getSafeFilename, calculateFileHash } from '../../utils/file';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { prisma } from '../../database';

export class UKContractsFinder implements ProcurementCrawler {
  portalName = 'UK Contracts Finder';
  baseUrl = 'https://www.contractsfinder.service.gov.uk';

  /**
   * Main execution method that orchestrates fetching listings and details.
   */
  async run() {
    logger.info(`Starting crawler for ${this.portalName}`);
    const listings = await this.crawlListings();
    
    for (const item of listings) {
      try {
        const detail = await this.crawlTenderDetails(item);
        const normalized = this.normalizeTender(detail);
        await this.saveToDatabase(normalized);
        
        await new Promise(r => setTimeout(r, env.REQUEST_DELAY_MS));
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(`Error processing tender ${item.title}: ${err.message}`);
        }
      }
    }
    
    logger.info(`Crawler finished for ${this.portalName}`);
  }

  /**
   * Scrapes the primary search results page for tender listings.
   * Uses configurable limits from the environment to prevent rate-limiting.
   * @returns An array of partial Tender objects representing basic listings.
   */
  async crawlListings(): Promise<Partial<Tender>[]> {
    logger.info('Fetching listings...');
    const url = `${this.baseUrl}/Search/Results`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch listings: ${response.statusText}`);
    }
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results: Partial<Tender>[] = [];
    $('.search-result').each((i, el) => {
      if (results.length >= env.CRAWL_RECORD_LIMIT) return false;
      
      const title = $(el).find('.search-result-header h2 a').text().trim();
      const relativeUrl = $(el).find('.search-result-header h2 a').attr('href');
      const department = $(el).find('.search-result-sub-header').text().trim();
      
      if (title && relativeUrl) {
        results.push({
          title,
          department,
          detailUrl: relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`,
        });
      }
    });

    return results;
  }

  /**
   * Scrapes detailed information for a specific tender, including pricing, dates, and PDFs.
   * @param tender The partial tender fetched from listings.
   * @returns An enriched partial Tender object with extracted fields.
   */
  async crawlTenderDetails(tender: Partial<Tender>): Promise<Partial<Tender>> {
    logger.info(`Fetching details for: ${tender.title}`);
    if (!tender.detailUrl) return tender;
    
    const response = await fetch(tender.detailUrl, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      logger.warn(`Failed to fetch details for ${tender.title}: ${response.statusText}. Saving basic listing only.`);
      return tender;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const tenderId = $('.content-block:contains("Reference number") + .content-block').text().trim() || 
                     $('.content-block:contains("Notice reference") + .content-block').text().trim() || 
                     tender.detailUrl.split('/').pop()?.split('?')[0];

    const valueStr = $('.content-block:contains("Value of contract") + .content-block').text().trim();
    let tenderValue = null;
    let currency = null;
    if (valueStr) {
      const match = valueStr.match(/([£$€])?([\d,.]+)/);
      if (match) {
        currency = match[1] === '£' ? 'GBP' : match[1] || 'GBP';
        tenderValue = parseFloat(match[2].replace(/,/g, ''));
      }
    }

    const closingStr = $('.content-block:contains("Closing date") + .content-block').text().trim();
    let closingDate = null;
    if (closingStr) {
      const parsed = new Date(closingStr);
      if (!isNaN(parsed.getTime())) {
        closingDate = parsed;
      }
    }

    let pdfUrl = null;
    const documentLink = $('.document-link').first();
    if (documentLink.length > 0) {
      const docHref = documentLink.attr('href');
      if (docHref && (docHref.toLowerCase().endsWith('.pdf') || docHref.includes('Download'))) {
        pdfUrl = docHref.startsWith('http') ? docHref : `${this.baseUrl}${docHref}`;
      }
    }

    let localPdfPath = null;
    let documentHash = null;
    if (pdfUrl) {
      try {
        const dl = await this.downloadDocument(pdfUrl, tenderId || 'unknown');
        if (dl) {
          localPdfPath = dl.localPath;
          documentHash = dl.hash;
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          logger.error(`Failed to download PDF for ${tender.title}: ${err.message}`);
        }
      }
    }

    return {
      ...tender,
      tenderId,
      tenderValue,
      currency,
      closingDate,
      pdfUrl,
      localPdfPath,
      documentHash,
      rawData: { htmlSnippet: $('main').html()?.substring(0, 500) }
    };
  }

  /**
   * Downloads an attached document (PDF/ZIP) if it exists and hasn't been downloaded before.
   * @param url The URL of the document.
   * @param tenderId The unique identifier for the tender.
   * @returns An object containing the local file path and its SHA-256 hash.
   */
  async downloadDocument(url: string, tenderId: string): Promise<{ localPath: string; hash: string } | null> {
    logger.info(`Downloading document from: ${url}`);
    
    const existing = await prisma.tender.findFirst({
      where: { tenderId, pdfUrl: url },
      select: { documentHash: true, localPdfPath: true }
    });
    
    if (existing && existing.localPdfPath && existing.documentHash) {
      logger.info(`Document already downloaded with hash: ${existing.documentHash}`);
      return { localPath: existing.localPdfPath, hash: existing.documentHash };
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    if (!response.body) {
      throw new Error(`Response body is null for: ${url}`);
    }
    
    if (!fs.existsSync(env.DOWNLOAD_DIR)) {
      fs.mkdirSync(env.DOWNLOAD_DIR, { recursive: true });
    }
    
    const filename = getSafeFilename(url, `${tenderId}_`);
    const localPath = path.join(env.DOWNLOAD_DIR, filename);
    
    await pipeline(Readable.fromWeb(response.body as unknown as import('stream/web').ReadableStream), fs.createWriteStream(localPath));
    const hash = await calculateFileHash(localPath);
    
    return { localPath, hash };
  }

  /**
   * Normalizes scraped data into a structured payload for database insertion.
   * @param data The scraped tender details.
   */
  normalizeTender(data: Partial<Tender>): Partial<Tender> {
    return {
      portalName: this.portalName,
      sourceUrl: data.detailUrl || this.baseUrl,
      tenderId: data.tenderId || `UNKNOWN-${Date.now()}`,
      title: data.title || 'Untitled',
      department: data.department || 'Unknown',
      closingDate: data.closingDate,
      tenderValue: data.tenderValue,
      currency: data.currency,
      detailUrl: data.detailUrl || '',
      pdfUrl: data.pdfUrl,
      localPdfPath: data.localPdfPath,
      documentHash: data.documentHash,
      status: 'PROCESSED',
      rawData: data.rawData || {},
    };
  }

  /**
   * Upserts the normalized tender into the database to prevent duplicates.
   * @param tender The normalized tender.
   */
  async saveToDatabase(tender: Partial<Tender>) {
    if (!tender.tenderId || !tender.portalName) return;
    
    await prisma.tender.upsert({
      where: {
        portalName_tenderId: {
          portalName: tender.portalName,
          tenderId: tender.tenderId,
        }
      },
      update: {
        title: tender.title,
        department: tender.department,
        closingDate: tender.closingDate,
        tenderValue: tender.tenderValue,
        currency: tender.currency,
        pdfUrl: tender.pdfUrl,
        localPdfPath: tender.localPdfPath,
        documentHash: tender.documentHash,
        status: tender.status,
        lastSeenAt: new Date(),
      },
      create: tender as Prisma.TenderCreateInput,
    });
    
    logger.info(`Saved tender ${tender.tenderId} to database.`);
  }
}
