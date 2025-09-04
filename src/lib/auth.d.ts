import { Session } from './auth';

export function getAuth(request: Request): Promise<Session | null>;