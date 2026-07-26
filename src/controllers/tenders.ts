import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database';
import { searchTendersQuerySchema, getTenderParamsSchema, createTenderSchema } from '../validators/tender';
import { calculateFileHash } from '../utils/file';
import fs from 'fs';
import path from 'path';

export async function searchTenders(req: Request, res: Response, next: NextFunction) {
  try {
    const query = searchTendersQuerySchema.parse(req.query);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }
    if (query.department) {
      where.department = { contains: query.department, mode: 'insensitive' };
    }
    if (query.portal) {
      where.portalName = { equals: query.portal, mode: 'insensitive' };
    }
    if (query.closingDateFrom || query.closingDateTo) {
      where.closingDate = {};
      if (query.closingDateFrom) where.closingDate.gte = new Date(query.closingDateFrom);
      if (query.closingDateTo) where.closingDate.lte = new Date(query.closingDateTo);
    }

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      prisma.tender.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { [query.sortBy]: query.sortOrder },
      }),
      prisma.tender.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTenderDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const params = getTenderParamsSchema.parse(req.params);

    const tender = await prisma.tender.findUnique({
      where: { id: params.id },
    });

    if (!tender) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Tender not found',
          details: []
        }
      });
    }

    res.json({ success: true, data: tender });
  } catch (error) {
    next(error);
  }
}

export async function createTender(req: Request, res: Response, next: NextFunction) {
  let localPdfPath: string | null = null;
  
  try {
    const data = createTenderSchema.parse(req.body);
    let documentHash = null;

    if (req.file) {
      localPdfPath = path.resolve(req.file.path);
      documentHash = await calculateFileHash(localPdfPath);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData: any = {};
    if (data.description) {
      rawData.description = data.description;
    }

    const tender = await prisma.tender.create({
      data: {
        portalName: 'Manual Upload',
        tenderId: `MANUAL-${Date.now()}`,
        title: data.title,
        department: data.department || 'Unknown',
        closingDate: data.closingDate ? new Date(data.closingDate) : null,
        localPdfPath,
        documentHash,
        sourceUrl: 'manual',
        detailUrl: 'manual',
        rawData,
      },
    });

    res.status(201).json({ success: true, data: tender });
  } catch (error) {
    if (localPdfPath && fs.existsSync(localPdfPath)) {
      try {
        fs.unlinkSync(localPdfPath);
      } catch {
        // Log cleanup failure but continue handling original error
      }
    }
    next(error);
  }
}
