import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'user' | 'logger' | 'admin';
export type AccessLevel = UserRole | 'all';

const useRoleAccess = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const currentRole = user?.role as UserRole | undefined;
  
  const hasAccess = useCallback((allowedRoles: AccessLevel[]) => {
    if (!isAuthenticated || !currentRole) return false;
    
    if (allowedRoles.includes('all')) return true;
    
    return allowedRoles.includes(currentRole) || 
           (currentRole === 'admin' && allowedRoles.includes('logger'));
  }, [isAuthenticated, currentRole]);

  const checkAccess = useCallback((allowedRoles: AccessLevel[], redirectTo: string = '/login') => {
    if (!hasAccess(allowedRoles)) {
      router.push(redirectTo);
      return false;
    }
    return true;
  }, [hasAccess, router]);

  return {
    currentRole,
    hasAccess,
    checkAccess,
    isUser: currentRole === 'user',
    isLogger: currentRole === 'logger',
    isAdmin: currentRole === 'admin'
  };
};

export default useRoleAccess;