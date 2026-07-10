import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AppError } from './errorHandler';

// Role hierarchy: ADMIN > PM > MEMBER > VIEWER
const ROLE_RANK: Record<Role, number> = {
  ADMIN: 4,
  PM: 3,
  MEMBER: 2,
  VIEWER: 1,
};

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    const hasRole = roles.some(
      (r) => ROLE_RANK[req.user!.role] >= ROLE_RANK[r],
    );

    if (!hasRole) {
      return next(new AppError(403, 'ROLE_INSUFFICIENT', 'You do not have permission to perform this action'));
    }

    next();
  };
}

export const requireAdmin  = requireRole(Role.ADMIN);
export const requirePM     = requireRole(Role.PM);
export const requireMember = requireRole(Role.MEMBER);
