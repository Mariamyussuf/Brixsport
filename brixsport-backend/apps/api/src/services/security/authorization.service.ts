import { logger } from '@utils/logger';
import { supabaseService } from '../supabase.service';
import { redisService } from '../redis.service';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string; // create, read, update, delete
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  rules: AccessRule[];
}

export interface AccessRule {
  resource: string;
  action: string;
  conditions: AccessCondition[];
  effect: 'allow' | 'deny';
}

export interface AccessCondition {
  attribute: string;
  operator: string; // eq, ne, gt, lt, in, notIn, etc.
  value: any;
}

export interface AuthorizationService {
  hasPermission(userId: string, permission: string): Promise<boolean>;
  hasRole(userId: string, role: string): Promise<boolean>;
  hasAnyRole(userId: string, roles: string[]): Promise<boolean>;
  hasAllRoles(userId: string, roles: string[]): Promise<boolean>;
  getUserPermissions(userId: string): Promise<string[]>;
  assignRole(userId: string, role: string): Promise<void>;
  removeRole(userId: string, role: string): Promise<void>;
}

export interface ABACService {
  evaluateAccess(
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean>;
  registerPolicy(policy: AccessPolicy): Promise<void>;
}

export const authorizationService: AuthorizationService = {
  hasPermission: async (userId: string, permission: string): Promise<boolean> => {
    try {
      logger.debug('Checking user permission', { userId, permission });
      
      // Try to get from Redis cache first
      const cacheKey = `user_permissions:${userId}`;
      let permissionsStr = await redisService.get(cacheKey);
      let permissions: string[] = [];
      
      if (permissionsStr) {
        permissions = JSON.parse(permissionsStr);
      } else {
        // If not in cache, get from database
        const { data, error } = await (supabaseService as any).supabase
          .from('UserRole')
          .select(`
            role,
            RolePermission(permission)
          `)
          .eq('userId', userId);
        
        if (!error && data) {
          // Extract permissions from roles
          const permissionSet = new Set<string>();
          for (const userRole of data) {
            if (userRole.RolePermission) {
              for (const rolePerm of userRole.RolePermission) {
                permissionSet.add(rolePerm.permission);
              }
            }
          }
          permissions = Array.from(permissionSet);
          
          // Cache for 1 hour
          await redisService.set(cacheKey, JSON.stringify(permissions), 60 * 60);
        }
      }
      
      const hasPermission = permissions.includes(permission);
      
      logger.debug('Permission check result', { userId, permission, hasPermission });
      return hasPermission;
    } catch (error: any) {
      logger.error('Permission check error', error);
      return false;
    }
  },
  
  hasRole: async (userId: string, role: string): Promise<boolean> => {
    try {
      logger.debug('Checking user role', { userId, role });
      
      // Try to get from Redis cache first
      const cacheKey = `user_roles:${userId}`;
      let rolesStr = await redisService.get(cacheKey);
      let roles: string[] = [];
      
      if (rolesStr) {
        roles = JSON.parse(rolesStr);
      } else {
        // If not in cache, get from database
        const { data, error } = await (supabaseService as any).supabase
          .from('UserRole')
          .select('role')
          .eq('userId', userId);
        
        if (!error && data) {
          roles = data.map((item: any) => item.role);
          // Cache for 1 hour
          await redisService.set(cacheKey, JSON.stringify(roles), 60 * 60);
        }
      }
      
      const hasRole = roles.includes(role);
      
      logger.debug('Role check result', { userId, role, hasRole });
      return hasRole;
    } catch (error: any) {
      logger.error('Role check error', error);
      return false;
    }
  },
  
  hasAnyRole: async (userId: string, roles: string[]): Promise<boolean> => {
    try {
      logger.debug('Checking if user has any role', { userId, roles });
      
      // Try to get from Redis cache first
      const cacheKey = `user_roles:${userId}`;
      let userRolesStr = await redisService.get(cacheKey);
      let userRoles: string[] = [];
      
      if (userRolesStr) {
        userRoles = JSON.parse(userRolesStr);
      } else {
        // If not in cache, get from database
        const { data, error } = await (supabaseService as any).supabase
          .from('UserRole')
          .select('role')
          .eq('userId', userId);
        
        if (!error && data) {
          userRoles = data.map((item: any) => item.role);
          // Cache for 1 hour
          await redisService.set(cacheKey, JSON.stringify(userRoles), 60 * 60);
        }
      }
      
      const hasAnyRole = roles.some(role => userRoles.includes(role));
      
      logger.debug('Any role check result', { userId, roles, hasAnyRole });
      return hasAnyRole;
    } catch (error: any) {
      logger.error('Any role check error', error);
      return false;
    }
  },
  
  hasAllRoles: async (userId: string, roles: string[]): Promise<boolean> => {
    try {
      logger.debug('Checking if user has all roles', { userId, roles });
      
      // Try to get from Redis cache first
      const cacheKey = `user_roles:${userId}`;
      let userRolesStr = await redisService.get(cacheKey);
      let userRoles: string[] = [];
      
      if (userRolesStr) {
        userRoles = JSON.parse(userRolesStr);
      } else {
        // If not in cache, get from database
        const { data, error } = await (supabaseService as any).supabase
          .from('UserRole')
          .select('role')
          .eq('userId', userId);
        
        if (!error && data) {
          userRoles = data.map((item: any) => item.role);
          // Cache for 1 hour
          await redisService.set(cacheKey, JSON.stringify(userRoles), 60 * 60);
        }
      }
      
      const hasAllRoles = roles.every(role => userRoles.includes(role));
      
      logger.debug('All roles check result', { userId, roles, hasAllRoles });
      return hasAllRoles;
    } catch (error: any) {
      logger.error('All roles check error', error);
      return false;
    }
  },
  
  getUserPermissions: async (userId: string): Promise<string[]> => {
    try {
      logger.debug('Getting user permissions', { userId });
      
      // Try to get from Redis cache first
      const cacheKey = `user_permissions:${userId}`;
      let permissionsStr = await redisService.get(cacheKey);
      
      if (permissionsStr) {
        return JSON.parse(permissionsStr);
      }
      
      // If not in cache, get from database
      const { data, error } = await (supabaseService as any).supabase
        .from('UserRole')
        .select(`
          role,
          RolePermission(permission)
        `)
        .eq('userId', userId);
      
      if (error) {
        logger.error('Failed to get user permissions from database', { userId, error: error.message });
        return [];
      }
      
      // Extract permissions from roles
      const permissionSet = new Set<string>();
      if (data) {
        for (const userRole of data) {
          if (userRole.RolePermission) {
            for (const rolePerm of userRole.RolePermission) {
              permissionSet.add(rolePerm.permission);
            }
          }
        }
      }
      
      const permissions = Array.from(permissionSet);
      
      // Cache for 1 hour
      await redisService.set(cacheKey, JSON.stringify(permissions), 60 * 60);
      
      logger.debug('User permissions retrieved', { userId, count: permissions.length });
      
      return permissions;
    } catch (error: any) {
      logger.error('Get user permissions error', error);
      return [];
    }
  },
  
  assignRole: async (userId: string, role: string): Promise<void> => {
    try {
      logger.info('Assigning role to user', { userId, role });
      
      // Check if user already has this role
      const hasRole = await authorizationService.hasRole(userId, role);
      if (hasRole) {
        logger.debug('User already has role', { userId, role });
        return;
      }
      
      // Assign role in database
      const { error } = await (supabaseService as any).supabase
        .from('UserRole')
        .insert({
          userId: userId,
          role: role,
          assignedAt: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(`Failed to assign role: ${error.message}`);
      }
      
      // Invalidate cache
      await redisService.del(`user_roles:${userId}`);
      await redisService.del(`user_permissions:${userId}`);
      
      logger.info('Role assigned', { userId, role });
    } catch (error: any) {
      logger.error('Role assignment error', error);
      throw error;
    }
  },
  
  removeRole: async (userId: string, role: string): Promise<void> => {
    try {
      logger.info('Removing role from user', { userId, role });
      
      // Remove role from database
      const { error } = await (supabaseService as any).supabase
        .from('UserRole')
        .delete()
        .eq('userId', userId)
        .eq('role', role);
      
      if (error) {
        throw new Error(`Failed to remove role: ${error.message}`);
      }
      
      // Invalidate cache
      await redisService.del(`user_roles:${userId}`);
      await redisService.del(`user_permissions:${userId}`);
      
      logger.info('Role removed', { userId, role });
    } catch (error: any) {
      logger.error('Role removal error', error);
      throw error;
    }
  }
};

export const abacService: ABACService = {
  evaluateAccess: async (
    userId: string,
    resource: string,
    action: string,
    context: Record<string, any>
  ): Promise<boolean> => {
    try {
      logger.debug('Evaluating ABAC access', { userId, resource, action });
      
      // Get user details
      const user = await supabaseService.getUserById(userId);
      if (!user) {
        logger.warn('User not found for ABAC evaluation', { userId });
        return false;
      }
      
      // Add user info to context
      const evaluationContext = {
        ...context,
        user: {
          id: user.id,
          role: user.role,
          email: user.email
        }
      };
      
      // Get policies from Redis cache or database
      const policyCacheKey = `access_policies`;
      let policiesStr = await redisService.get(policyCacheKey);
      let policies: AccessPolicy[] = [];
      
      if (policiesStr) {
        policies = JSON.parse(policiesStr);
      } else {
        // If not in cache, get from database
        const { data, error } = await (supabaseService as any).supabase
          .from('AccessPolicy')
          .select(`
            id,
            name,
            description,
            rules:AccessRule(
              resource,
              action,
              effect,
              conditions:AccessCondition(
                attribute,
                operator,
                value
              )
            )
          `);
        
        if (!error && data) {
          policies = data.map((policy: any) => ({
            id: policy.id,
            name: policy.name,
            description: policy.description,
            rules: policy.rules ? policy.rules.map((rule: any) => ({
              resource: rule.resource,
              action: rule.action,
              effect: rule.effect,
              conditions: rule.conditions || []
            })) : []
          }));
          
          // Cache for 10 minutes
          await redisService.set(policyCacheKey, JSON.stringify(policies), 10 * 60);
        }
      }
      
      // Evaluate all policies
      for (const policy of policies) {
        // Check each rule in the policy
        for (const rule of policy.rules) {
          // Check if rule matches resource and action
          if (rule.resource === resource && rule.action === action) {
            // Evaluate conditions
            let conditionsMet = true;
            
            for (const condition of rule.conditions) {
              const attributeValue = getNestedProperty(evaluationContext, condition.attribute);
              
              switch (condition.operator) {
                case 'eq':
                  conditionsMet = attributeValue === condition.value;
                  break;
                case 'ne':
                  conditionsMet = attributeValue !== condition.value;
                  break;
                case 'gt':
                  conditionsMet = attributeValue > condition.value;
                  break;
                case 'lt':
                  conditionsMet = attributeValue < condition.value;
                  break;
                case 'in':
                  conditionsMet = Array.isArray(condition.value) && condition.value.includes(attributeValue);
                  break;
                case 'notIn':
                  conditionsMet = Array.isArray(condition.value) && !condition.value.includes(attributeValue);
                  break;
                default:
                  conditionsMet = false;
              }
              
              // If any condition is not met, break
              if (!conditionsMet) {
                break;
              }
            }
            
            // If all conditions are met, apply the rule effect
            if (conditionsMet) {
              const result = rule.effect === 'allow';
              logger.debug('ABAC evaluation result', { 
                policy: policy.name, 
                rule: `${rule.resource}:${rule.action}`, 
                result 
              });
              return result;
            }
          }
        }
      }
      
      // Default deny if no policies match
      logger.debug('ABAC evaluation result: default deny', { userId, resource, action });
      return false;
    } catch (error: any) {
      logger.error('ABAC evaluation error', error);
      return false;
    }
  },
  
  registerPolicy: async (policy: AccessPolicy): Promise<void> => {
    try {
      logger.info('Registering access policy', { policyId: policy.id, policyName: policy.name });
      
      // Store policy in database
      const { error } = await (supabaseService as any).supabase
        .from('AccessPolicy')
        .upsert({
          id: policy.id,
          name: policy.name,
          description: policy.description
        }, {
          onConflict: 'id'
        });
      
      if (error) {
        throw new Error(`Failed to store policy: ${error.message}`);
      }
      
      // Store rules in database
      if (policy.rules && policy.rules.length > 0) {
        const rulesToInsert = policy.rules.map(rule => ({
          policyId: policy.id,
          resource: rule.resource,
          action: rule.action,
          effect: rule.effect
        }));
        
        const { error: rulesError } = await (supabaseService as any).supabase
          .from('AccessRule')
          .upsert(rulesToInsert, {
            onConflict: 'policyId,resource,action'
          });
        
        if (rulesError) {
          logger.warn('Failed to store policy rules', { policyId: policy.id, error: rulesError.message });
        }
      }
      
      // Invalidate cache
      await redisService.del('access_policies');
      
      logger.info('Policy registered', { policyId: policy.id });
    } catch (error: any) {
      logger.error('Policy registration error', error);
      throw error;
    }
  }
};

// Helper function to get nested property values
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}