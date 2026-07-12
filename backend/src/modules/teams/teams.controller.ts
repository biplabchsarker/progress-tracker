import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TeamRole } from '@prisma/client';
import * as teamsService from './teams.service';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

const updateSchema = createSchema.partial();

const addMemberSchema = z.object({
  userId: z.string().uuid(),
  teamRole: z.nativeEnum(TeamRole).default(TeamRole.MEMBER),
});

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const teams = await teamsService.list(req.user!);
    res.json({ teams });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const team = await teamsService.getById(req.user!, req.params.id);
    res.json({ team });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createSchema.parse(req.body);
    const team = await teamsService.create(req.user!, body);
    res.status(201).json({ team });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateSchema.parse(req.body);
    const team = await teamsService.update(req.params.id, body);
    res.json({ team });
  } catch (err) {
    next(err);
  }
}

export async function addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = addMemberSchema.parse(req.body);
    const member = await teamsService.addMember(req.params.id, body.userId, body.teamRole);
    res.status(201).json({ member });
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await teamsService.removeMember(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
