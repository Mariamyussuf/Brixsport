import { useCallback } from 'react';
import useRoleAccess from './useRoleAccess';
import type { AccessLevel, UserRole } from './useRoleAccess';
import TeamService from '@/services/TeamService';
import APIService from '@/services/APIService';
import { useRouter } from 'next/navigation';

export function useApi() {
  const { hasAccess, currentRole } = useRoleAccess();
  const router = useRouter();

  const handleApiCall = useCallback(async (
    apiCall: () => Promise<any>,
    requiredRoles: UserRole[]
  ) => {
    if (!currentRole || !hasAccess(requiredRoles.map(role => role as AccessLevel))) {
      router.push('/login');
      return { success: false, error: 'Unauthorized' };
    }

    try {
      return await apiCall();
    } catch (error) {
      console.error('API call failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API call failed'
      };
    }
  }, [currentRole, hasAccess, router]);

  return {
    // Teams API
    getTeams: () => handleApiCall(
      () => TeamService.getAll(),
      ['user', 'logger', 'admin']
    ),
  };
}