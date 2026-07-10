import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@prisma/client';
import * as tasksService from './tasks.service';

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.string().date().optional(),
  parentTaskId: z.string().uuid().optional(),
});

const updateSchema = z
  .object({
    title: z.string().min(1).max(300),
    description: z.string().max(5000),
    status: z.nativeEnum(TaskStatus),
    progressPct: z.number().int().min(0).max(100),
    dueDate: z.string().date(),
    priority: z.nativeEnum(TaskPriority),
  })
  .partial();

const assignSchema = z.array(
  z.object({
    userId: z.string().uuid(),
    engagementPct: z.number().int().min(0).max(100),
  }),
);

export async function listForProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tasks = await tasksService.listForProject(req.user!, req.params.projectId);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createSchema.parse(req.body);
    const task = await tasksService.create(req.user!, req.params.projectId, body);
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await tasksService.getById(req.user!, req.params.id);
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateSchema.parse(req.body);
    const task = await tasksService.update(req.user!, req.params.id, body);
    res.json({ task });
  } catch (err) {
    next(err);
  }
}

export async function assign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = assignSchema.parse(req.body);
    const assignments = await tasksService.assign(req.params.id, body, req.user!.sub);
    res.status(201).json({ assignments });
  } catch (err) {
    next(err);
  }
}

export async function unassign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await tasksService.unassign(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
