import APIService from './APIService';
import { APIEndpoint } from '@/types/api';
import { Match, MatchEvent } from '@/types/matchTracker';

const matchTrackerEndpoints = {
  getMatches: {
    url: '/matches',
    method: 'GET',
  } as APIEndpoint<Match[]>,
  getMatch: (id: string) => ({
    url: `/matches/${id}`,
    method: 'GET',
  } as APIEndpoint<Match>),
  createMatch: {
    url: '/matches',
    method: 'POST',
  } as APIEndpoint<Match>,
  updateMatch: (id: string) => ({
    url: `/matches/${id}`,
    method: 'PUT',
  } as APIEndpoint<Match>),
  addEvent: (matchId: string) => ({
    url: `/matches/${matchId}/events`,
    method: 'POST',
  } as APIEndpoint<MatchEvent>),
  updateEvent: (matchId: string, eventId: string) => ({
    url: `/matches/${matchId}/events/${eventId}`,
    method: 'PUT',
  } as APIEndpoint<MatchEvent>),
  deleteEvent: (matchId: string, eventId: string) => ({
    url: `/matches/${matchId}/events/${eventId}`,
    method: 'DELETE',
  } as APIEndpoint),
  subscribeToMatch: (matchId: string, callback: (message: any) => void) => {
    // WebSocket logic here
    const ws = new WebSocket(`wss://brixsport.onrender.com/ws/matches/${matchId}`);
    ws.onmessage = (event) => {
      callback(JSON.parse(event.data));
    };
    return ws;
  }
};

class MatchTrackerService {
  async getMatches(): Promise<Match[]> {
    const response = await APIService.request(matchTrackerEndpoints.getMatches);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch matches');
  }

  async getMatch(id: string): Promise<Match> {
    const response = await APIService.request(matchTrackerEndpoints.getMatch(id));
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to fetch match');
  }

  async createMatch(data: Partial<Omit<Match, 'id'>>): Promise<Match> {
    // Allow UI to pass partial match data; APIService will validate/complete
    const response = await APIService.request(matchTrackerEndpoints.createMatch, data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to create match');
  }

  async updateMatch(id: string, data: Partial<Match>): Promise<Match> {
    const response = await APIService.request(matchTrackerEndpoints.updateMatch(id), data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update match');
  }

  async addEvent(matchId: string, data: Partial<Omit<MatchEvent, 'id'>>): Promise<MatchEvent> {
    const response = await APIService.request(matchTrackerEndpoints.addEvent(matchId), data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to add event');
  }

  async updateEvent(matchId: string, eventId: string, data: Partial<MatchEvent>): Promise<MatchEvent> {
    const response = await APIService.request(matchTrackerEndpoints.updateEvent(matchId, eventId), data);
    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.error?.message || 'Failed to update event');
  }

  async deleteEvent(matchId: string, eventId: string): Promise<void> {
    const response = await APIService.request(matchTrackerEndpoints.deleteEvent(matchId, eventId));
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete event');
    }
  }

  subscribeToMatch(matchId: string, callback: (message: any) => void): WebSocket {
    return matchTrackerEndpoints.subscribeToMatch(matchId, callback);
  }
}

export default new MatchTrackerService();
