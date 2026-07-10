import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Role } from '@prisma/client';
import * as usersService from './users.service';
import * as projectsService from '../projects/projects.service';

const listQuerySchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});

const adminUpdateSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  isActive: z.boolean().optional(),
});

const selfUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const query = listQuerySchema.parse(req.query);
    const users = await usersService.list(query);
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getById(req.user!, req.params.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getById(req.user!, req.user!.sub);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function getEngagement(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const engagement = await projectsService.computeUserEngagement(req.params.id);
    res.json(engagement);
  } catch (err) {
    next(err);
  }
}

export async function updateAsAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = adminUpdateSchema.parse(req.body);
    const user = await usersService.updateAsAdmin(req.params.id, body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = selfUpdateSchema.parse(req.body);
    const user = await usersService.updateSelf(req.user!.sub, body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
