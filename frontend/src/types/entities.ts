import type { Role } from './auth';

export interface Client {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdById: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export type TeamRole = 'LEAD' | 'MEMBER';

export interface TeamMember {
  teamId: string;
  userId: string;
  teamRole: TeamRole;
  joinedAt: string;
  user: { id: string; name: string; email: string; role: Role };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  createdById: string;
  _count?: { members: number };
  members?: TeamMember[];
}
