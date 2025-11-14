import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { logger } from '../utils/logger';

export interface CSPConfig {
  directives: {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    mediaSrc?: string[];
    frameSrc?: string[];
    childSrc?: string[];
    frameAncestors?: string[];
    formAction?: string[];
    baseUri?: string[];
    reportUri?: string[];
  };
  reportOnly?: boolean;
}

export interface SecurityHeadersMiddleware {
  applySecurityHeaders(): any;
  configureCSP(options: CSPConfig): any;
  configureReferrerPolicy(policy: string): any;
  enhancedSecurityHeaders(): any;
}

export const securityHeadersMiddleware: SecurityHeadersMiddleware = {
  applySecurityHeaders: () => {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        logger.debug('Applying security headers');
        next();
      } catch (error: any) {
        logger.error('Security headers middleware error', error);
        next();
      }
    };
  },
  
  configureCSP: (options: CSPConfig) => {
    return helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        ...options.directives
      },
      reportOnly: options.reportOnly || false
    });
  },
  
  configureReferrerPolicy: (policy: string) => {
    return helmet.referrerPolicy({ policy: policy as any });
  },
  
  enhancedSecurityHeaders: () => {
    return [
      // Enhanced Helmet.js protection
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
            childSrc: ["'none'"],
            frameAncestors: ["'none'"],
            formAction: ["'self'"],
            baseUri: ["'self'"],
            reportUri: ["/csp-report"]
          }
        },
        referrerPolicy: {
          policy: "strict-origin-when-cross-origin"
        },
        hsts: {
          maxAge: 31536000, // 1 year
          includeSubDomains: true,
          preload: true
        },
        frameguard: {
          action: "deny"
        },
        dnsPrefetchControl: {
          allow: false
        },
        permittedCrossDomainPolicies: {
          permittedPolicies: "none"
        },
        hidePoweredBy: true,
        ieNoOpen: true,
        noSniff: true,
        xssFilter: true
      }),
      
      // Additional security headers
      (req: Request, res: Response, next: NextFunction): void => {
        // X-Content-Type-Options
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // X-Frame-Options
        res.setHeader('X-Frame-Options', 'DENY');
        
        // X-XSS-Protection
        res.setHeader('X-XSS-Protection', '1; mode=block');
        
        // Strict-Transport-Security (HSTS)
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        
        // Referrer-Policy
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Permissions-Policy
        res.setHeader('Permissions-Policy', "geolocation=(), microphone=(), camera=()");
        
        // Remove X-Powered-By
        res.removeHeader('X-Powered-By');
        
        next();
      }
    ];
  }
};

// Default security headers middleware
export const defaultSecurityHeaders = [
  helmet(),
  helmet.permittedCrossDomainPolicies(),
  // helmet.expectCt(), // Removed as it's not available in current helmet version
  securityHeadersMiddleware.configureReferrerPolicy('strict-origin-when-cross-origin')
];

// Enhanced security headers middleware
export const enhancedSecurityHeaders = securityHeadersMiddleware.enhancedSecurityHeaders();