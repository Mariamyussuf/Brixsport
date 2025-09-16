import { useCallback } from 'react';
import useRoleAccess from './useRoleAccess';
import type { AccessLevel, UserRole } from './useRoleAccess';
import TeamService from '@/services/TeamService';
import APIService from '@/services/APIService';
import { useRouter } from 'next/navigation';
import BrixSportsService from '@/services/BrixSportsService';
import { CreateTeamPayload, CreateTrackEventPayload, TrackEvent } from '@/types/brixsports';

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
    
    // Create team API
    createTeam: (payload: CreateTeamPayload) => handleApiCall(
      () => BrixSportsService.createTeam(payload),
      ['logger', 'admin']
    ),
    
    // Get team by ID API
    getTeamById: (id: number) => handleApiCall(
      () => BrixSportsService.getTeamById(id),
      ['user', 'logger', 'admin']
    ),
    
    // Create track event API
    createTrackEvent: (payload: CreateTrackEventPayload) => handleApiCall(
      () => BrixSportsService.createTrackEvent(payload),
      ['logger', 'admin']
    ),
    
    // Update track event status API
    updateTrackEventStatus: (id: number, status: string) => handleApiCall(
      () => BrixSportsService.updateTrackEventStatus(id, status),
      ['logger', 'admin']
    ),
    
    // Get track event by ID API
    getTrackEventById: (id: number) => handleApiCall(
      () => BrixSportsService.getTrackEventById(id),
      ['user', 'logger', 'admin']
    ),
  };
}