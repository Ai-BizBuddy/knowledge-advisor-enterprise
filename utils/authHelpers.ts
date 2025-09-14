/**
 * Auth helper utilities for handling remember me functionality
 */

const REMEMBER_ME_KEY = 'knowledge_advisor_remember_me';
const REMEMBER_EMAIL_KEY = 'knowledge_advisor_email';

export interface RememberedCredentials {
    email: string;
    rememberMe: boolean;
}

/**
 * Save credentials when "Remember me" is checked
 */
export const saveRememberedCredentials = (email: string, rememberMe: boolean): void => {
    if (typeof window === 'undefined') return;

        if (rememberMe) {
        // cookie
        document.cookie = `${REMEMBER_EMAIL_KEY}=${email}; path=/;`;
        document.cookie = `${REMEMBER_ME_KEY}=true; path=/;`;
    }
    if (!rememberMe) {
        document.cookie = `${REMEMBER_EMAIL_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${REMEMBER_ME_KEY}=false; path=/;`;
    }
};

/**
 * Get saved credentials if remember me was checked
 */
export const getRememberedCredentials = (): RememberedCredentials | null => {
    if (typeof window === 'undefined') return null;

    const rememberMe = document.cookie.split('; ').find(row => row.startsWith(REMEMBER_ME_KEY))?.split('=')[1] === 'true';
    const email = document.cookie.split('; ').find(row => row.startsWith(REMEMBER_EMAIL_KEY))?.split('=')[1];

    if (rememberMe && email) {
        return { email, rememberMe };
    }

    return null;
};

/**
 * Clear all remembered credentials
 */
export const clearRememberedCredentials = (): void => {
    if (typeof window === 'undefined') return;

    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
};

/**
 * Check if user has remember me enabled
 */
export const hasRememberedCredentials = (): boolean => {
    if (typeof window === 'undefined') return false;

    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
};
