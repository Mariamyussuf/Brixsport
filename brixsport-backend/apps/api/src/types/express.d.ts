import { JwtPayload } from 'jsonwebtoken';

// Make the user property flexible enough to handle different structures
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { 
        id?: string;
        userId?: string;
        email?: string;
        role?: string;
        [key: string]: any; // Allow additional properties
      };
    }
  }
}

export {};