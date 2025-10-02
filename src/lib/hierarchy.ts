// This is a server-side file.
'use server';

import type { User } from '@/types';

// Helper function to get all subordinates of a manager (recursively)
export const getSubordinates = async (managerId: string, allUsers: User[]): Promise<string[]> => {
  const manager = allUsers.find(u => u.id === managerId);
  if (!manager) return [];

  let directSubordinates: User[] = [];

  // A Chair's subordinates are Leads and Members in their team
  if (manager.role === 'Chair of Directors') {
    directSubordinates = allUsers.filter(user => user.team === manager.team && (user.role === 'Lead' || user.role === 'Member'));
  }
  // A Lead's subordinates are Members in their sub-team
  else if (manager.role === 'Lead') {
    directSubordinates = allUsers.filter(user => user.subTeam === manager.subTeam && user.role === 'Member');
  }

  const subordinateIds = directSubordinates.map(s => s.id);

  // Recursively find subordinates of the direct subordinates (for Chairs overseeing Leads)
  const nestedSubordinates = (await Promise.all(subordinateIds.map(id => getSubordinates(id, allUsers)))).flat();
  
  return [...new Set([...subordinateIds, ...nestedSubordinates])];
};
