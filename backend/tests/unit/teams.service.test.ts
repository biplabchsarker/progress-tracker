import { prisma } from '../../src/config/prisma';
import { AppError } from '../../src/middleware/errorHandler';
import * as teamsService from '../../src/modules/teams/teams.service';
import type { JwtPayload } from '../../src/middleware/auth';

describe('teams.service', () => {
  let pm: JwtPayload;
  let member: JwtPayload;
  let outsider: JwtPayload;

  beforeAll(async () => {
    const pmUser = await prisma.user.create({
      data: { email: 'test-teams-pm@example.com', name: 'Test PM', passwordHash: 'x', role: 'PM' },
    });
    const memberUser = await prisma.user.create({
      data: { email: 'test-teams-member@example.com', name: 'Test Member', passwordHash: 'x', role: 'MEMBER' },
    });
    const outsiderUser = await prisma.user.create({
      data: { email: 'test-teams-outsider@example.com', name: 'Outsider', passwordHash: 'x', role: 'MEMBER' },
    });

    pm = { sub: pmUser.id, email: pmUser.email, role: 'PM' };
    member = { sub: memberUser.id, email: memberUser.email, role: 'MEMBER' };
    outsider = { sub: outsiderUser.id, email: outsiderUser.email, role: 'MEMBER' };
  });

  afterAll(async () => {
    await prisma.team.deleteMany({ where: { name: { startsWith: 'Test Team ' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test-teams-' } } });
    await prisma.$disconnect();
  });

  it('creates a team and adds a member', async () => {
    const team = await teamsService.create(pm, { name: 'Test Team Alpha' });
    const membership = await teamsService.addMember(team.id, member.sub, 'MEMBER');
    expect(membership.userId).toBe(member.sub);

    const fetched = await teamsService.getById(pm, team.id);
    expect(fetched.members).toHaveLength(1);
    expect(fetched.members[0].user.id).toBe(member.sub);
  });

  it('rejects adding the same member twice', async () => {
    const team = await teamsService.create(pm, { name: 'Test Team Beta' });
    await teamsService.addMember(team.id, member.sub, 'MEMBER');
    await expect(teamsService.addMember(team.id, member.sub, 'MEMBER')).rejects.toThrow(AppError);
  });

  it('removes a member', async () => {
    const team = await teamsService.create(pm, { name: 'Test Team Gamma' });
    await teamsService.addMember(team.id, member.sub, 'LEAD');
    await teamsService.removeMember(team.id, member.sub);

    const fetched = await teamsService.getById(pm, team.id);
    expect(fetched.members).toHaveLength(0);
  });

  it('404s when fetching a team that does not exist', async () => {
    await expect(teamsService.getById(pm, '00000000-0000-0000-0000-000000000000')).rejects.toThrow(AppError);
  });

  it('scopes team visibility: a non-member gets 404 and is excluded from the list; a member sees both', async () => {
    const team = await teamsService.create(pm, { name: 'Test Team Scoped' });
    await teamsService.addMember(team.id, member.sub, 'MEMBER');

    await expect(teamsService.getById(outsider, team.id)).rejects.toThrow(AppError);
    const outsiderList = await teamsService.list(outsider);
    expect(outsiderList.some((t) => t.id === team.id)).toBe(false);

    const memberFetch = await teamsService.getById(member, team.id);
    expect(memberFetch.id).toBe(team.id);
    const memberList = await teamsService.list(member);
    expect(memberList.some((t) => t.id === team.id)).toBe(true);

    const pmList = await teamsService.list(pm);
    expect(pmList.some((t) => t.id === team.id)).toBe(true);
  });
});
