import { logger } from '../utils/logger';
import { supabaseService } from './supabase.service';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

// Sync operation storage
interface SyncOperation {
  id: string;
  type: 'batch_upload' | 'import' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data: any;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const syncOperations: Map<string, SyncOperation> = new Map();

// Validation function for match events
function validateMatchEvent(event: any): string | null {
  if (!event || typeof event !== 'object') {
    return 'Event must be an object';
  }

  if (!event.matchId || typeof event.matchId !== 'string') {
    return 'matchId is required and must be a string';
  }

  if (!event.type || typeof event.type !== 'string') {
    return 'type is required and must be a string';
  }

  // Validate event type
  const validEventTypes = [
    'goal', 'assist', 'yellow_card', 'red_card', 'substitution',
    'foul', 'offside', 'corner', 'free_kick', 'penalty',
    'shot', 'save', 'start', 'end', 'half_time', 'full_time'
  ];

  if (!validEventTypes.includes(event.type)) {
    return `Invalid event type. Must be one of: ${validEventTypes.join(', ')}`;
  }

  if (event.minute !== undefined && (typeof event.minute !== 'number' || event.minute < 0 || event.minute > 150)) {
    return 'minute must be a number between 0 and 150';
  }

  if (event.second !== undefined && (typeof event.second !== 'number' || event.second < 0 || event.second > 59)) {
    return 'second must be a number between 0 and 59';
  }

  return null; // No validation errors
}

// Conflict resolution function
async function resolveSingleConflict(conflict: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Validate conflict structure
    if (!conflict || typeof conflict !== 'object') {
      return { success: false, error: 'Invalid conflict structure' };
    }

    if (!conflict.type || !conflict.data) {
      return { success: false, error: 'Conflict must have type and data' };
    }

    const { type, data } = conflict;

    switch (type) {
      case 'duplicate_event':
        return await resolveDuplicateEventConflict(data);

      case 'conflicting_scores':
        return await resolveScoreConflict(data);

      case 'conflicting_event_data':
        return await resolveEventDataConflict(data);

      case 'missing_player':
        return await resolveMissingPlayerConflict(data);

      default:
        return { success: false, error: `Unknown conflict type: ${type}` };
    }
  } catch (error: any) {
    logger.error('Error in resolveSingleConflict', { conflict, error });
    return { success: false, error: error.message };
  }
}

// Resolve duplicate event conflicts
async function resolveDuplicateEventConflict(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const { events, strategy = 'prefer_newer' } = data;

  if (!Array.isArray(events) || events.length < 2) {
    return { success: false, error: 'Duplicate event conflict must have at least 2 events' };
  }

  // Strategy: prefer_newer, prefer_admin, manual
  switch (strategy) {
    case 'prefer_newer':
      // Sort by timestamp and keep the newest
      events.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return {
        success: true,
        data: {
          action: 'keep_newest',
          keptEvent: events[0],
          discardedEvents: events.slice(1),
          strategy: 'prefer_newer'
        }
      };

    case 'prefer_admin':
      // Look for admin-submitted events
      const adminEvent = events.find(e => e.source === 'admin' || e.userRole === 'admin');
      if (adminEvent) {
        return {
          success: true,
          data: {
            action: 'keep_admin',
            keptEvent: adminEvent,
            discardedEvents: events.filter(e => e !== adminEvent),
            strategy: 'prefer_admin'
          }
        };
      }
      // Fall back to prefer_newer if no admin event
      return resolveDuplicateEventConflict({ ...data, strategy: 'prefer_newer' });

    case 'manual':
      // For manual resolution, just mark as needs_review
      return {
        success: true,
        data: {
          action: 'needs_review',
          events: events,
          strategy: 'manual',
          message: 'Manual review required'
        }
      };

    default:
      return { success: false, error: `Unknown resolution strategy: ${strategy}` };
  }
}

// Resolve conflicting score data
async function resolveScoreConflict(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const { matchId, conflictingScores, strategy = 'prefer_official' } = data;

  if (!matchId || !Array.isArray(conflictingScores)) {
    return { success: false, error: 'Score conflict must have matchId and conflictingScores array' };
  }

  switch (strategy) {
    case 'prefer_official':
      // Look for official source
      const officialScore = conflictingScores.find(s => s.source === 'official' || s.source === 'admin');
      if (officialScore) {
        return {
          success: true,
          data: {
            action: 'update_score',
            matchId,
            newScore: officialScore,
            oldScores: conflictingScores.filter(s => s !== officialScore),
            strategy: 'prefer_official'
          }
        };
      }
      return { success: false, error: 'No official score source found' };

    case 'average':
      // Calculate average scores (for non-critical conflicts)
      const avgHome = Math.round(conflictingScores.reduce((sum, s) => sum + (s.homeScore || 0), 0) / conflictingScores.length);
      const avgAway = Math.round(conflictingScores.reduce((sum, s) => sum + (s.awayScore || 0), 0) / conflictingScores.length);

      return {
        success: true,
        data: {
          action: 'update_score',
          matchId,
          newScore: { homeScore: avgHome, awayScore: avgAway },
          oldScores: conflictingScores,
          strategy: 'average'
        }
      };

    default:
      return { success: false, error: `Unknown score resolution strategy: ${strategy}` };
  }
}

// Resolve conflicting event data
async function resolveEventDataConflict(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const { eventId, conflictingData, strategy = 'prefer_detailed' } = data;

  if (!eventId || !Array.isArray(conflictingData)) {
    return { success: false, error: 'Event data conflict must have eventId and conflictingData array' };
  }

  switch (strategy) {
    case 'prefer_detailed':
      // Prefer the version with more complete data
      let bestData = conflictingData[0];
      for (const item of conflictingData) {
        if (countNonNullFields(item) > countNonNullFields(bestData)) {
          bestData = item;
        }
      }

      return {
        success: true,
        data: {
          action: 'update_event',
          eventId,
          newData: bestData,
          oldData: conflictingData.filter(d => d !== bestData),
          strategy: 'prefer_detailed'
        }
      };

    case 'merge':
      // Merge conflicting data
      const merged = { ...conflictingData[0] };
      for (let i = 1; i < conflictingData.length; i++) {
        Object.keys(conflictingData[i]).forEach(key => {
          if (merged[key] === null || merged[key] === undefined) {
            merged[key] = conflictingData[i][key];
          }
        });
      }

      return {
        success: true,
        data: {
          action: 'update_event',
          eventId,
          newData: merged,
          oldData: conflictingData,
          strategy: 'merge'
        }
      };

    default:
      return { success: false, error: `Unknown event data resolution strategy: ${strategy}` };
  }
}

// Resolve missing player conflicts
async function resolveMissingPlayerConflict(data: any): Promise<{ success: boolean; data?: any; error?: string }> {
  const { eventId, suggestedPlayer, strategy = 'create_player' } = data;

  if (!eventId || !suggestedPlayer) {
    return { success: false, error: 'Missing player conflict must have eventId and suggestedPlayer' };
  }

  switch (strategy) {
    case 'create_player':
      // Create the missing player
      try {
        const playerData = {
          firstName: suggestedPlayer.firstName || 'Unknown',
          lastName: suggestedPlayer.lastName || 'Player',
          displayName: suggestedPlayer.displayName || `${suggestedPlayer.firstName || 'Unknown'} ${suggestedPlayer.lastName || 'Player'}`,
          teamId: suggestedPlayer.teamId,
          sport: suggestedPlayer.sport || 'football',
          position: suggestedPlayer.position,
          status: 'active'
        };

        const result = await supabaseService.createPlayer(playerData);
        if (result.success) {
          return {
            success: true,
            data: {
              action: 'create_player',
              eventId,
              createdPlayer: result.data,
              strategy: 'create_player'
            }
          };
        } else {
          return { success: false, error: 'Failed to create player' };
        }
      } catch (error: any) {
        return { success: false, error: `Error creating player: ${error.message}` };
      }

    case 'skip':
      // Remove the event with missing player
      return {
        success: true,
        data: {
          action: 'remove_event',
          eventId,
          reason: 'missing_player',
          strategy: 'skip'
        }
      };

    default:
      return { success: false, error: `Unknown missing player resolution strategy: ${strategy}` };
  }
}

// Helper function to count non-null fields
function countNonNullFields(obj: any): number {
  return Object.values(obj).filter(value => value !== null && value !== undefined && value !== '').length;
}

// Parse CSV match data
function parseCSVMatchData(csvContent: string): any[] {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('Invalid CSV content');
  }

  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const matches = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }

    const match: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert common fields to appropriate types
      if (header.includes('date') || header.includes('time')) {
        match[header] = value ? new Date(value) : null;
      } else if (header.includes('score') || header.includes('minute')) {
        match[header] = value ? parseInt(value, 10) : null;
      } else {
        match[header] = value || null;
      }
    });

    matches.push(match);
  }

  return matches;
}

// Validate match data for import
function validateMatchData(match: any): string | null {
  if (!match || typeof match !== 'object') {
    return 'Match data must be an object';
  }

  // Required fields
  if (!match.competitionId && !match.competition_id) {
    return 'competitionId is required';
  }

  if (!match.homeTeamId && !match.home_team_id) {
    return 'homeTeamId is required';
  }

  if (!match.awayTeamId && !match.away_team_id) {
    return 'awayTeamId is required';
  }

  if (!match.startTime && !match.match_date) {
    return 'startTime is required';
  }

  // Validate team IDs exist (basic check)
  const homeTeamId = match.homeTeamId || match.home_team_id;
  const awayTeamId = match.awayTeamId || match.away_team_id;

  if (homeTeamId === awayTeamId) {
    return 'Home and away teams cannot be the same';
  }

  // Validate date
  const startTime = match.startTime || match.match_date;
  if (startTime && isNaN(new Date(startTime).getTime())) {
    return 'Invalid startTime format';
  }

  return null;
}

// Check if match already exists
async function checkExistingMatch(matchData: any): Promise<any | null> {
  try {
    const homeTeamId = matchData.homeTeamId || matchData.home_team_id;
    const awayTeamId = matchData.awayTeamId || matchData.away_team_id;
    const startTime = matchData.startTime || matchData.match_date;

    if (!homeTeamId || !awayTeamId || !startTime) {
      return null;
    }

    // Query for existing matches with same teams and date
    const { data, error } = await supabase
      .from('Match')
      .select('*')
      .eq('homeTeamId', homeTeamId)
      .eq('awayTeamId', awayTeamId)
      .gte('startTime', new Date(startTime).toISOString().split('T')[0]) // Same date
      .lt('startTime', new Date(new Date(startTime).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Next day
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return data || null;
  } catch (error: any) {
    logger.error('Error checking existing match', { matchData, error });
    return null; // Don't block import due to check failure
  }
}

// Create match from import data
async function createMatchFromImport(matchData: any): Promise<any | null> {
  try {
    // Normalize field names
    const normalizedData = {
      competitionId: matchData.competitionId || matchData.competition_id,
      homeTeamId: matchData.homeTeamId || matchData.home_team_id,
      awayTeamId: matchData.awayTeamId || matchData.away_team_id,
      venueId: matchData.venueId || matchData.venue_id || null,
      startTime: matchData.startTime || matchData.match_date,
      status: matchData.status || 'scheduled',
      homeScore: matchData.homeScore || matchData.home_score || null,
      awayScore: matchData.awayScore || matchData.away_score || null,
      currentMinute: matchData.currentMinute || matchData.current_minute || null,
      period: matchData.period || null,
      referee: matchData.referee || null,
      attendance: matchData.attendance || null,
      weather: matchData.weather || null,
      notes: matchData.notes || null,
      venue: matchData.venue || null,
      importance: matchData.importance || 'regular'
    };

    // Validate teams exist
    const homeTeamResult = await supabaseService.getTeam(normalizedData.homeTeamId);
    if (!homeTeamResult.success) {
      throw new Error(`Home team not found: ${normalizedData.homeTeamId}`);
    }

    const awayTeamResult = await supabaseService.getTeam(normalizedData.awayTeamId);
    if (!awayTeamResult.success) {
      throw new Error(`Away team not found: ${normalizedData.awayTeamId}`);
    }

    // Insert the match
    const { data, error } = await supabase
      .from('Match')
      .insert(normalizedData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info('Created match from import', { matchId: data.id });
    return data;
  } catch (error: any) {
    logger.error('Error creating match from import', { matchData, error });
    throw error;
  }
}

// Parse CSV player data
function parseCSVPlayerData(csvContent: string): any[] {
  if (!csvContent || typeof csvContent !== 'string') {
    throw new Error('Invalid CSV content');
  }

  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const players = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      throw new Error(`Row ${i + 1} has ${values.length} columns, expected ${headers.length}`);
    }

    const player: any = {};
    headers.forEach((header, index) => {
      const value = values[index];
      // Convert common fields to appropriate types
      if (header.includes('date') || header.includes('birth')) {
        player[header] = value ? new Date(value) : null;
      } else if (header.includes('number') || header.includes('height') || header.includes('weight')) {
        player[header] = value ? parseInt(value, 10) : null;
      } else if (header === 'marketvalue' || header === 'salary') {
        player[header] = value ? parseFloat(value) : null;
      } else {
        player[header] = value || null;
      }
    });

    players.push(player);
  }

  return players;
}

// Validate player data for import
function validatePlayerData(player: any): string | null {
  if (!player || typeof player !== 'object') {
    return 'Player data must be an object';
  }

  // Required fields
  if (!player.firstName && !player.first_name) {
    return 'firstName is required';
  }

  if (!player.lastName && !player.last_name) {
    return 'lastName is required';
  }

  if (!player.teamId && !player.team_id) {
    return 'teamId is required';
  }

  if (!player.sport) {
    return 'sport is required';
  }

  // Validate sport type
  const validSports = ['football', 'basketball', 'track_events', 'other'];
  if (!validSports.includes(player.sport)) {
    return `Invalid sport. Must be one of: ${validSports.join(', ')}`;
  }

  // Validate date of birth
  const dateOfBirth = player.dateOfBirth || player.date_of_birth;
  if (dateOfBirth && isNaN(new Date(dateOfBirth).getTime())) {
    return 'Invalid dateOfBirth format';
  }

  // Validate numeric fields
  if (player.height !== undefined && (typeof player.height !== 'number' || player.height < 0 || player.height > 300)) {
    return 'height must be a number between 0 and 300 cm';
  }

  if (player.weight !== undefined && (typeof player.weight !== 'number' || player.weight < 0 || player.weight > 500)) {
    return 'weight must be a number between 0 and 500 kg';
  }

  if (player.number !== undefined && (typeof player.number !== 'number' || player.number < 0 || player.number > 99)) {
    return 'number must be between 0 and 99';
  }

  return null;
}

// Check if player already exists
async function checkExistingPlayer(playerData: any): Promise<any | null> {
  try {
    const firstName = playerData.firstName || playerData.first_name;
    const lastName = playerData.lastName || playerData.last_name;
    const teamId = playerData.teamId || playerData.team_id;

    if (!firstName || !lastName || !teamId) {
      return null;
    }

    // Query for existing players with same name and team
    const { data, error } = await supabase
      .from('Player')
      .select('*')
      .eq('firstName', firstName)
      .eq('lastName', lastName)
      .eq('teamId', teamId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return data || null;
  } catch (error: any) {
    logger.error('Error checking existing player', { playerData, error });
    return null; // Don't block import due to check failure
  }
}

// Create player from import data
async function createPlayerFromImport(playerData: any): Promise<any | null> {
  try {
    // Normalize field names
    const normalizedData = {
      firstName: playerData.firstName || playerData.first_name,
      lastName: playerData.lastName || playerData.last_name,
      displayName: playerData.displayName || playerData.display_name ||
                   `${playerData.firstName || playerData.first_name} ${playerData.lastName || playerData.last_name}`,
      dateOfBirth: playerData.dateOfBirth || playerData.date_of_birth,
      nationality: playerData.nationality,
      gender: playerData.gender,
      sport: playerData.sport,
      position: playerData.position,
      number: playerData.number,
      height: playerData.height,
      weight: playerData.weight,
      teamId: playerData.teamId || playerData.team_id,
      status: playerData.status || 'active',
      profilePictureUrl: playerData.profilePictureUrl || playerData.profile_picture_url,
      biography: playerData.biography,
      socialMediaLinks: playerData.socialMediaLinks || playerData.social_media_links,
      marketValue: playerData.marketValue || playerData.market_value,
      salary: playerData.salary,
      contractStart: playerData.contractStart || playerData.contract_start,
      contractEnd: playerData.contractEnd || playerData.contract_end
    };

    // Validate team exists
    const teamResult = await supabaseService.getTeam(normalizedData.teamId);
    if (!teamResult.success) {
      throw new Error(`Team not found: ${normalizedData.teamId}`);
    }

    // Insert the player
    const { data, error } = await supabase
      .from('Player')
      .insert(normalizedData)
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    logger.info('Created player from import', { playerId: data.id });
    return data;
  } catch (error: any) {
    logger.error('Error creating player from import', { playerData, error });
    throw error;
  }
}

// Fetch matches for export with filters
async function fetchMatchesForExport(filters: any): Promise<any[]> {
  try {
    let query = supabase
      .from('Match')
      .select(`
        *,
        homeTeam:Team!homeTeamId(name, logo),
        awayTeam:Team!awayTeamId(name, logo),
        competition:Competition(name, sportType),
        venue:Venue(name, city, country)
      `);

    // Apply filters
    if (filters.competitionId) {
      query = query.eq('competitionId', filters.competitionId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.teamId) {
      query = query.or(`homeTeamId.eq.${filters.teamId},awayTeamId.eq.${filters.teamId}`);
    }

    if (filters.startDate) {
      query = query.gte('startTime', new Date(filters.startDate).toISOString());
    }

    if (filters.endDate) {
      query = query.lte('startTime', new Date(filters.endDate).toISOString());
    }

    if (filters.venueId) {
      query = query.eq('venueId', filters.venueId);
    }

    // Order by start time
    query = query.order('startTime', { ascending: true });

    // Apply limit if specified
    if (filters.limit && typeof filters.limit === 'number') {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    logger.error('Error fetching matches for export', { filters, error });
    throw error;
  }
}

// Generate CSV from match data
function generateMatchCSV(matches: any[]): { content: string; filename: string } {
  if (!matches || matches.length === 0) {
    return { content: '', filename: 'empty_export.csv' };
  }

  const headers = [
    'Match ID',
    'Competition',
    'Home Team',
    'Away Team',
    'Start Time',
    'Status',
    'Home Score',
    'Away Score',
    'Venue',
    'Referee',
    'Attendance',
    'Weather'
  ];

  const rows = matches.map(match => [
    match.id,
    match.competition?.name || '',
    match.homeTeam?.name || '',
    match.awayTeam?.name || '',
    match.startTime ? new Date(match.startTime).toISOString() : '',
    match.status || '',
    match.homeScore || '',
    match.awayScore || '',
    match.venue?.name || '',
    match.referee || '',
    match.attendance || '',
    match.weather || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return {
    content: csvContent,
    filename: 'matches_export.csv'
  };
}

// Save export file to cloud storage
async function saveExportFile(content: string, filename: string, contentType: string): Promise<string> {
  try {
    // Check if we have cloud storage configured
    const storageProvider = process.env.STORAGE_PROVIDER || 'local'; // 'aws', 'gcp', 'azure', 'local'

    switch (storageProvider) {
      case 'aws':
        return await saveToAWS(content, filename, contentType);

      case 'gcp':
        return await saveToGCP(content, filename, contentType);

      case 'azure':
        return await saveToAzure(content, filename, contentType);

      case 'local':
      default:
        return await saveToLocal(content, filename, contentType);
    }
  } catch (error: any) {
    logger.error('Error saving export file', { filename, error });
    throw new Error(`Failed to save export file: ${error.message}`);
  }
}

// Save to AWS S3
async function saveToAWS(content: string, filename: string, contentType: string): Promise<string> {
  const AWS = require('aws-sdk');

  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || 'us-east-1';
  const bucketName = process.env.AWS_S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error('AWS S3 configuration missing. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET environment variables.');
  }

  const s3 = new AWS.S3({
    accessKeyId,
    secretAccessKey,
    region
  });

  const key = `exports/${Date.now()}_${filename}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: content,
    ContentType: contentType,
    ACL: 'private', // or 'public-read' depending on your needs
    Metadata: {
      'original-filename': filename,
      'upload-date': new Date().toISOString()
    }
  };

  const result = await s3.upload(params).promise();

  // Store file metadata in database
  await storeFileMetadata({
    filename,
    key,
    bucket: bucketName,
    url: result.Location,
    size: content.length,
    contentType,
    provider: 'aws'
  });

  logger.info('File uploaded to AWS S3', { filename, key, size: content.length });
  return result.Location;
}

// Save to Google Cloud Storage
async function saveToGCP(content: string, filename: string, contentType: string): Promise<string> {
  const { Storage } = require('@google-cloud/storage');

  const projectId = process.env.GCP_PROJECT_ID;
  const keyFile = process.env.GCP_KEY_FILE;
  const bucketName = process.env.GCP_BUCKET;

  if (!projectId || !keyFile || !bucketName) {
    throw new Error('GCP configuration missing. Please set GCP_PROJECT_ID, GCP_KEY_FILE, and GCP_BUCKET environment variables.');
  }

  const storage = new Storage({
    projectId,
    keyFilename: keyFile
  });

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(`exports/${Date.now()}_${filename}`);

  const stream = file.createWriteStream({
    metadata: {
      contentType,
      metadata: {
        'original-filename': filename,
        'upload-date': new Date().toISOString()
      }
    }
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${file.name}`;

      // Store file metadata in database
      await storeFileMetadata({
        filename,
        key: file.name,
        bucket: bucketName,
        url: publicUrl,
        size: content.length,
        contentType,
        provider: 'gcp'
      });

      logger.info('File uploaded to GCP', { filename, key: file.name, size: content.length });
      resolve(publicUrl);
    });

    stream.end(content);
  });
}

// Save to Azure Blob Storage
async function saveToAzure(content: string, filename: string, contentType: string): Promise<string> {
  const { BlobServiceClient } = require('@azure/storage-blob');

  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_CONTAINER || 'exports';

  if (!connectionString) {
    throw new Error('Azure configuration missing. Please set AZURE_STORAGE_CONNECTION_STRING environment variable.');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobName = `exports/${Date.now()}_${filename}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const uploadResult = await blockBlobClient.upload(content, content.length, {
    blobHTTPHeaders: {
      blobContentType: contentType
    },
    metadata: {
      'original-filename': filename,
      'upload-date': new Date().toISOString()
    }
  });

  // Store file metadata in database
  await storeFileMetadata({
    filename,
    key: blobName,
    bucket: containerName,
    url: blockBlobClient.url,
    size: content.length,
    contentType,
    provider: 'azure'
  });

  logger.info('File uploaded to Azure', { filename, blobName, size: content.length });
  return blockBlobClient.url;
}

// Save to local filesystem (for development/testing)
async function saveToLocal(content: string, filename: string, contentType: string): Promise<string> {
  const fs = require('fs').promises;
  const path = require('path');

  const exportDir = process.env.EXPORT_DIR || path.join(process.cwd(), 'exports');
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}_${filename}`;
  const filePath = path.join(exportDir, uniqueFilename);

  // Ensure export directory exists
  await fs.mkdir(exportDir, { recursive: true });

  // Write file
  await fs.writeFile(filePath, content, 'utf8');

  // Generate local URL (for development)
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const publicUrl = `${baseUrl}/exports/${uniqueFilename}`;

  // Store file metadata in database
  await storeFileMetadata({
    filename,
    key: uniqueFilename,
    bucket: 'local',
    url: publicUrl,
    size: content.length,
    contentType,
    provider: 'local',
    localPath: filePath
  });

  logger.info('File saved locally', { filename, filePath, size: content.length });
  return publicUrl;
}

// Store file metadata in database for tracking
async function storeFileMetadata(metadata: {
  filename: string;
  key: string;
  bucket: string;
  url: string;
  size: number;
  contentType: string;
  provider: string;
  localPath?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('export_files')
      .insert({
        filename: metadata.filename,
        storageKey: metadata.key,
        bucket: metadata.bucket,
        url: metadata.url,
        size: metadata.size,
        contentType: metadata.contentType,
        provider: metadata.provider,
        localPath: metadata.localPath,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)) // 30 days
      });

    if (error) {
      logger.warn('Failed to store file metadata', { error });
      // Don't throw - file was saved successfully, metadata is optional
    }
  } catch (error) {
    logger.warn('Error storing file metadata', { error });
  }
}

// Fetch competitions for export with filters
async function fetchCompetitionsForExport(filters: any): Promise<any[]> {
  try {
    let query = supabase
      .from('Competition')
      .select(`
        *,
        season:Season(name, year),
        matches:Match(count)
      `);

    // Apply filters
    if (filters.sportType) {
      query = query.eq('sportType', filters.sportType);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.seasonId) {
      query = query.eq('seasonId', filters.seasonId);
    }

    if (filters.startDate) {
      query = query.gte('startDate', new Date(filters.startDate).toISOString());
    }

    if (filters.endDate) {
      query = query.lte('endDate', new Date(filters.endDate).toISOString());
    }

    // Order by start date
    query = query.order('startDate', { ascending: true });

    // Apply limit if specified
    if (filters.limit && typeof filters.limit === 'number') {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    logger.error('Error fetching competitions for export', { filters, error });
    throw error;
  }
}

// Generate CSV from competition data
function generateCompetitionCSV(competitions: any[]): { content: string; filename: string } {
  if (!competitions || competitions.length === 0) {
    return { content: '', filename: 'empty_export.csv' };
  }

  const headers = [
    'Competition ID',
    'Name',
    'Description',
    'Sport Type',
    'Status',
    'Category',
    'Start Date',
    'End Date',
    'Season',
    'Max Teams',
    'Prize Money',
    'Currency'
  ];

  const rows = competitions.map(comp => [
    comp.id,
    comp.name || '',
    comp.description || '',
    comp.sportType || '',
    comp.status || '',
    comp.category || '',
    comp.startDate ? new Date(comp.startDate).toISOString() : '',
    comp.endDate ? new Date(comp.endDate).toISOString() : '',
    comp.season?.name || '',
    comp.maxTeams || '',
    comp.prizeMoney || '',
    comp.currency || ''
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  return {
    content: csvContent,
    filename: 'competitions_export.csv'
  };
}

export const syncService = {
  // Batch upload offline events
  batchUploadEvents: async (events: any[]) => {
    try {
      logger.info('Batch uploading offline events', { eventCount: events.length });

      if (!Array.isArray(events) || events.length === 0) {
        throw new Error('Invalid events data: must be non-empty array');
      }

      const syncId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create sync operation record
      const syncOp: SyncOperation = {
        id: syncId,
        type: 'batch_upload',
        status: 'processing',
        data: { events },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      syncOperations.set(syncId, syncOp);

      const processedEvents = [];
      const errors = [];
      let successCount = 0;

      // Process each event
      for (let i = 0; i < events.length; i++) {
        const event = events[i];

        try {
          // Validate event structure
          const validationError = validateMatchEvent(event);
          if (validationError) {
            errors.push({
              index: i,
              event: event,
              error: validationError
            });
            continue;
          }

          // Check if match exists
          const matchResult = await supabaseService.getMatch(event.matchId);
          if (!matchResult.success) {
            errors.push({
              index: i,
              event: event,
              error: `Match not found: ${event.matchId}`
            });
            continue;
          }

          // Check if player exists (if provided)
          if (event.playerId) {
            const playerResult = await supabaseService.getPlayer(event.playerId);
            if (!playerResult.success) {
              errors.push({
                index: i,
                event: event,
                error: `Player not found: ${event.playerId}`
              });
              continue;
            }
          }

          // Insert event into database
          const eventData = {
            matchId: event.matchId,
            type: event.type,
            playerId: event.playerId || null,
            teamId: event.teamId || null,
            minute: event.minute || null,
            second: event.second || null,
            description: event.description || null,
            value: event.value || null,
            metadata: event.metadata || null,
            createdAt: new Date()
          };

          const { data, error } = await supabase
            .from('MatchEvent')
            .insert(eventData)
            .select()
            .single();

          if (error) {
            errors.push({
              index: i,
              event: event,
              error: `Database error: ${error.message}`
            });
            continue;
          }

          processedEvents.push(data);
          successCount++;

        } catch (eventError: any) {
          logger.error('Error processing individual event', { event, error: eventError });
          errors.push({
            index: i,
            event: event,
            error: eventError.message
          });
        }
      }

      // Update sync operation status
      syncOp.status = successCount === events.length ? 'completed' : 'completed';
      syncOp.result = {
        totalCount: events.length,
        processedCount: successCount,
        errorCount: errors.length,
        processedEvents,
        errors
      };
      syncOp.updatedAt = new Date();
      syncOperations.set(syncId, syncOp);

      logger.info('Batch upload completed', {
        totalCount: events.length,
        successCount,
        errorCount: errors.length
      });

      return {
        success: true,
        data: {
          syncId,
          totalCount: events.length,
          processedCount: successCount,
          errorCount: errors.length,
          processedEvents,
          errors: errors.length > 0 ? errors : undefined
        }
      };
    } catch (error: any) {
      logger.error('Batch upload events error', error);
      throw error;
    }
  },
  
  // Check sync status
  getSyncStatus: async (syncId: string) => {
    try {
      logger.info('Checking sync status', { syncId });
      
      const syncOp = syncOperations.get(syncId);
      if (!syncOp) {
        throw new Error('Sync operation not found');
      }
      
      return {
        success: true,
        data: syncOp
      };
    } catch (error: any) {
      logger.error('Get sync status error', error);
      throw error;
    }
  },
  
  // Resolve sync conflicts
  resolveConflicts: async (conflicts: any[]) => {
    try {
      logger.info('Resolving sync conflicts', { conflictCount: conflicts.length });

      if (!Array.isArray(conflicts) || conflicts.length === 0) {
        throw new Error('Invalid conflicts data: must be non-empty array');
      }

      const resolvedConflicts = [];
      const failedResolutions = [];
      let successCount = 0;

      for (let i = 0; i < conflicts.length; i++) {
        const conflict = conflicts[i];

        try {
          const resolution = await resolveSingleConflict(conflict);
          if (resolution.success) {
            resolvedConflicts.push({
              ...conflict,
              resolved: true,
              resolution: resolution.data,
              resolvedAt: new Date()
            });
            successCount++;
          } else {
            failedResolutions.push({
              index: i,
              conflict: conflict,
              error: resolution.error
            });
          }
        } catch (conflictError: any) {
          logger.error('Error resolving conflict', { conflict, error: conflictError });
          failedResolutions.push({
            index: i,
            conflict: conflict,
            error: conflictError.message
          });
        }
      }

      logger.info('Conflict resolution completed', {
        totalCount: conflicts.length,
        resolvedCount: successCount,
        failedCount: failedResolutions.length
      });

      return {
        success: true,
        data: {
          resolvedConflicts,
          failedResolutions: failedResolutions.length > 0 ? failedResolutions : undefined,
          totalCount: conflicts.length,
          resolvedCount: successCount,
          failedCount: failedResolutions.length
        }
      };
    } catch (error: any) {
      logger.error('Resolve sync conflicts error', error);
      throw error;
    }
  },
  
  // Import match data (admin)
  importMatchData: async (data: any) => {
    try {
      logger.info('Importing match data', { data });

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data: must be an object');
      }

      const syncId = `import_matches_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create sync operation record
      const syncOp: SyncOperation = {
        id: syncId,
        type: 'import',
        status: 'processing',
        data: { importData: data },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      syncOperations.set(syncId, syncOp);

      let matches = [];
      const format = data.format || 'json';

      // Parse data based on format
      if (format === 'csv') {
        matches = parseCSVMatchData(data.content);
      } else if (format === 'json') {
        matches = data.matches || [data];
      } else {
        throw new Error(`Unsupported format: ${format}. Supported formats: json, csv`);
      }

      if (!Array.isArray(matches) || matches.length === 0) {
        throw new Error('No valid match data found to import');
      }

      const results: {
        imported: Array<{ index: number; match: any; createdId: string }>;
        skipped: Array<{ index: number; match: any; reason: string; existingId?: string }>;
        errors: Array<{ index: number; match: any; error: string }>;
      } = {
        imported: [],
        skipped: [],
        errors: []
      };

      let importedCount = 0;

      // Process each match
      for (let i = 0; i < matches.length; i++) {
        const matchData = matches[i];

        try {
          // Validate match data
          const validationError = validateMatchData(matchData);
          if (validationError) {
            results.errors.push({
              index: i,
              match: matchData,
              error: validationError
            });
            continue;
          }

          // Check if match already exists
          const existingMatch = await checkExistingMatch(matchData);
          if (existingMatch) {
            results.skipped.push({
              index: i,
              match: matchData,
              reason: 'Match already exists',
              existingId: existingMatch.id
            });
            continue;
          }

          // Create the match
          const createdMatch = await createMatchFromImport(matchData);
          if (createdMatch) {
            results.imported.push({
              index: i,
              match: matchData,
              createdId: createdMatch.id
            });
            importedCount++;
          } else {
            results.errors.push({
              index: i,
              match: matchData,
              error: 'Failed to create match'
            });
          }

        } catch (matchError: any) {
          logger.error('Error importing individual match', { match: matchData, error: matchError });
          results.errors.push({
            index: i,
            match: matchData,
            error: matchError.message
          });
        }
      }

      // Update sync operation status
      syncOp.status = 'completed';
      syncOp.result = {
        totalCount: matches.length,
        importedCount,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length,
        results
      };
      syncOp.updatedAt = new Date();
      syncOperations.set(syncId, syncOp);

      logger.info('Match data import completed', {
        totalCount: matches.length,
        importedCount,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length
      });

      return {
        success: true,
        data: {
          syncId,
          totalCount: matches.length,
          importedCount,
          skippedCount: results.skipped.length,
          errorCount: results.errors.length,
          imported: results.imported,
          skipped: results.skipped.length > 0 ? results.skipped : undefined,
          errors: results.errors.length > 0 ? results.errors : undefined,
          importId: syncId
        }
      };
    } catch (error: any) {
      logger.error('Import match data error', error);
      throw error;
    }
  },
  
  // Import player data (admin)
  importPlayerData: async (data: any) => {
    try {
      logger.info('Importing player data', { data });

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid import data: must be an object');
      }

      const syncId = `import_players_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create sync operation record
      const syncOp: SyncOperation = {
        id: syncId,
        type: 'import',
        status: 'processing',
        data: { importData: data },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      syncOperations.set(syncId, syncOp);

      let players = [];
      const format = data.format || 'json';

      // Parse data based on format
      if (format === 'csv') {
        players = parseCSVPlayerData(data.content);
      } else if (format === 'json') {
        players = data.players || [data];
      } else {
        throw new Error(`Unsupported format: ${format}. Supported formats: json, csv`);
      }

      if (!Array.isArray(players) || players.length === 0) {
        throw new Error('No valid player data found to import');
      }

      const results: {
        imported: Array<{ index: number; player: any; createdId: string }>;
        skipped: Array<{ index: number; player: any; reason: string; existingId?: string }>;
        errors: Array<{ index: number; player: any; error: string }>;
      } = {
        imported: [],
        skipped: [],
        errors: []
      };

      let importedCount = 0;

      // Process each player
      for (let i = 0; i < players.length; i++) {
        const playerData = players[i];

        try {
          // Validate player data
          const validationError = validatePlayerData(playerData);
          if (validationError) {
            results.errors.push({
              index: i,
              player: playerData,
              error: validationError
            });
            continue;
          }

          // Check if player already exists
          const existingPlayer = await checkExistingPlayer(playerData);
          if (existingPlayer) {
            results.skipped.push({
              index: i,
              player: playerData,
              reason: 'Player already exists',
              existingId: existingPlayer.id
            });
            continue;
          }

          // Create the player
          const createdPlayer = await createPlayerFromImport(playerData);
          if (createdPlayer) {
            results.imported.push({
              index: i,
              player: playerData,
              createdId: createdPlayer.id
            });
            importedCount++;
          } else {
            results.errors.push({
              index: i,
              player: playerData,
              error: 'Failed to create player'
            });
          }

        } catch (playerError: any) {
          logger.error('Error importing individual player', { player: playerData, error: playerError });
          results.errors.push({
            index: i,
            player: playerData,
            error: playerError.message
          });
        }
      }

      // Update sync operation status
      syncOp.status = 'completed';
      syncOp.result = {
        totalCount: players.length,
        importedCount,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length,
        results
      };
      syncOp.updatedAt = new Date();
      syncOperations.set(syncId, syncOp);

      logger.info('Player data import completed', {
        totalCount: players.length,
        importedCount,
        skippedCount: results.skipped.length,
        errorCount: results.errors.length
      });

      return {
        success: true,
        data: {
          syncId,
          totalCount: players.length,
          importedCount,
          skippedCount: results.skipped.length,
          errorCount: results.errors.length,
          imported: results.imported,
          skipped: results.skipped.length > 0 ? results.skipped : undefined,
          errors: results.errors.length > 0 ? results.errors : undefined,
          importId: syncId
        }
      };
    } catch (error: any) {
      logger.error('Import player data error', error);
      throw error;
    }
  },
  
  // Export match data
  exportMatchData: async (filters: any) => {
    try {
      logger.info('Exporting match data', { filters });

      const syncId = `export_matches_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create sync operation record
      const syncOp: SyncOperation = {
        id: syncId,
        type: 'export',
        status: 'processing',
        data: { filters },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      syncOperations.set(syncId, syncOp);

      // Fetch match data with filters
      const matchData = await fetchMatchesForExport(filters);

      if (!matchData || matchData.length === 0) {
        syncOp.status = 'completed';
        syncOp.result = { exportedCount: 0, exportUrl: null };
        syncOp.updatedAt = new Date();
        syncOperations.set(syncId, syncOp);

        return {
          success: true,
          data: {
            syncId,
            exportedCount: 0,
            message: 'No matches found with the given filters',
            exportUrl: null
          }
        };
      }

      // Generate export in requested format
      const format = filters.format || 'json';
      let exportContent = '';
      let exportUrl = '';
      let filename = '';

      if (format === 'csv') {
        const csvData = generateMatchCSV(matchData);
        exportContent = csvData.content;
        exportUrl = await saveExportFile(csvData.content, 'matches_export.csv', 'text/csv');
        filename = 'matches_export.csv';
      } else if (format === 'json') {
        const jsonData = {
          exportDate: new Date().toISOString(),
          filters: filters,
          totalCount: matchData.length,
          matches: matchData
        };
        exportContent = JSON.stringify(jsonData, null, 2);
        exportUrl = await saveExportFile(exportContent, 'matches_export.json', 'application/json');
        filename = 'matches_export.json';
      } else {
        throw new Error(`Unsupported export format: ${format}. Supported formats: json, csv`);
      }

      // Update sync operation status
      syncOp.status = 'completed';
      syncOp.result = {
        exportedCount: matchData.length,
        exportUrl,
        filename,
        format
      };
      syncOp.updatedAt = new Date();
      syncOperations.set(syncId, syncOp);

      logger.info('Match data export completed', {
        exportedCount: matchData.length,
        format,
        filename
      });

      return {
        success: true,
        data: {
          syncId,
          exportedCount: matchData.length,
          exportUrl,
          filename,
          format,
          fileSize: exportContent.length
        }
      };
    } catch (error: any) {
      logger.error('Export match data error', error);
      throw error;
    }
  },
  
  // Export competition data
  exportCompetitionData: async (filters: any) => {
    try {
      logger.info('Exporting competition data', { filters });

      const syncId = `export_competitions_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create sync operation record
      const syncOp: SyncOperation = {
        id: syncId,
        type: 'export',
        status: 'processing',
        data: { filters },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      syncOperations.set(syncId, syncOp);

      // Fetch competition data with filters
      const competitionData = await fetchCompetitionsForExport(filters);

      if (!competitionData || competitionData.length === 0) {
        syncOp.status = 'completed';
        syncOp.result = { exportedCount: 0, exportUrl: null };
        syncOp.updatedAt = new Date();
        syncOperations.set(syncId, syncOp);

        return {
          success: true,
          data: {
            syncId,
            exportedCount: 0,
            message: 'No competitions found with the given filters',
            exportUrl: null
          }
        };
      }

      // Generate export in requested format
      const format = filters.format || 'json';
      let exportContent = '';
      let exportUrl = '';
      let filename = '';

      if (format === 'csv') {
        const csvData = generateCompetitionCSV(competitionData);
        exportContent = csvData.content;
        exportUrl = await saveExportFile(csvData.content, 'competitions_export.csv', 'text/csv');
        filename = 'competitions_export.csv';
      } else if (format === 'json') {
        const jsonData = {
          exportDate: new Date().toISOString(),
          filters: filters,
          totalCount: competitionData.length,
          competitions: competitionData
        };
        exportContent = JSON.stringify(jsonData, null, 2);
        exportUrl = await saveExportFile(exportContent, 'competitions_export.json', 'application/json');
        filename = 'competitions_export.json';
      } else {
        throw new Error(`Unsupported export format: ${format}. Supported formats: json, csv`);
      }

      // Update sync operation status
      syncOp.status = 'completed';
      syncOp.result = {
        exportedCount: competitionData.length,
        exportUrl,
        filename,
        format
      };
      syncOp.updatedAt = new Date();
      syncOperations.set(syncId, syncOp);

      logger.info('Competition data export completed', {
        exportedCount: competitionData.length,
        format,
        filename
      });

      return {
        success: true,
        data: {
          syncId,
          exportedCount: competitionData.length,
          exportUrl,
          filename,
          format,
          fileSize: exportContent.length
        }
      };
    } catch (error: any) {
      logger.error('Export competition data error', error);
      throw error;
    }
  }
};