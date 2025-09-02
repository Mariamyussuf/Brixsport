/**
 * Onboarding utility functions
 */

/**
 * Check if the user has completed onboarding
 * @returns boolean indicating if onboarding is completed
 */
export const hasCompletedOnboarding = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('hasCompletedOnboarding') === 'true';
};

/**
 * Mark onboarding as completed
 */
export const markOnboardingCompleted = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('hasCompletedOnboarding', 'true');
};

/**
 * Clear onboarding completion status
 */
export const clearOnboardingStatus = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('hasCompletedOnboarding');
};