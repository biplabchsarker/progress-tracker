import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as clientsService from './clients.service';

const createSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
});

const updateSchema = createSchema.partial();

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const clients = await clientsService.list(req.user!);
    res.json({ clients });
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const client = await clientsService.getById(req.user!, req.params.id);
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = createSchema.parse(req.body);
    const client = await clientsService.create(req.user!, body);
    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = updateSchema.parse(req.body);
    const client = await clientsService.update(req.user!, req.params.id, body);
    res.json({ client });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await clientsService.remove(req.user!, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
