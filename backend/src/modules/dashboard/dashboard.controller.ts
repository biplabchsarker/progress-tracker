import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export async function getAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dashboard = await dashboardService.getAdminDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}

export async function getForCaller(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const caller = req.user!;
    const dashboard =
      caller.role === 'ADMIN'
        ? await dashboardService.getAdminDashboard()
        : caller.role === 'PM'
          ? await dashboardService.getPmDashboard(caller)
          : caller.role === 'MEMBER'
            ? await dashboardService.getMemberDashboard(caller)
            : await dashboardService.getViewerDashboard();
    res.json(dashboard);
  } catch (err) {
    next(err);
  }
}
