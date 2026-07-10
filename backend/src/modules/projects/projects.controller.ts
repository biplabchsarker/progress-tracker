import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectCategory, ProjectStatus, ProjectPriority } from '@prisma/client';
import * as projectsService from './projects.service';

const createSchema = z
  .object({
    name: z.string().min(1).max(200),
    category: z.nativeEnum(ProjectCategory),
    clientId: z.string().uuid().optional(),
    priority: z.nativeEnum(ProjectPriority).optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().optional(),
    tags: z.array(z.string()).optional(),
    teamId: z.string().uuid().optional(),
  })
  .strict();

const updateSchema = z
  .object({
    name: z.string().min(1).max(200),
    status: z.nativeEnum(ProjectStatus),
    priority: z.nativeEnum(ProjectPriority),
    startDate: z.string().date(),
    endDate: z.string().date(),
    tags: z.array(z.string()),
    teamId: z.string().uuid(),
    tasksEnabled: z.boolean(),
  })
  .partial();

const engagementSchema = z.object({
  userId: z.string().uuid(),
  engagementPct: z.number().int().min(0).max(100),
  isBillable: z.boolean().optional(),
  notes: z.string().max(2000).optional(),
});

const engagementUpdateSchema = z
  .object({
    engagementPct: z.number().int().min(0).max(100),
    isBillable: z.boolean(),
    notes: z.string().max(2000),
  })
  .partial();

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const category = req.query.category as ProjectCategory | undefined;
    const projects = await projectsService.list(req.user!, category);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await projectsService.getById(req.user!, req.params.id);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createSchema.parse(req.body);
    const project = await projectsService.create(req.user!, body);
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateSchema.parse(req.body);
    const project = await projectsService.update(req.user!, req.params.id, body);
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function listEngagements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const engagements = await projectsService.listEngagements(req.params.id);
    res.json({ engagements });
  } catch (err) {
    next(err);
  }
}

export async function addEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = engagementSchema.parse(req.body);
    const result = await projectsService.addEngagement(req.params.id, body, req.user!.sub);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = engagementUpdateSchema.parse(req.body);
    const result = await projectsService.updateEngagement(req.params.id, req.params.userId, body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await projectsService.removeEngagement(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
