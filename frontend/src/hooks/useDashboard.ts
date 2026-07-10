import { useQuery } from '@tanstack/react-query';
import { getDashboard } from '../services/dashboardService';

export function useDashboard() {
  return useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });
}
