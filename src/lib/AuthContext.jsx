import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { disableLocalClinic, enableLocalClinic, isLocalClinicSession, LOCAL_CLINIC_USER } from '@/lib/clinic/localMode';
import { isStandaloneBuild, withDeadline, absoluteAppPath } from '@/lib/clinic/standalone';
import { setPilotMode } from '@/lib/medscan/runtimeMode';
import { AUTH_MODES, fetchCurrentUser, getAuthMode, logoutHosted } from '@/lib/auth/authAdapter';
import { loadStoredSession } from '@/lib/auth/supabaseAuth';

const AuthContext = createContext();

function localClinicAtBoot(extra = {}) {
  return isLocalClinicSession({
    appId: appParams.appId,
    token: appParams.token,
    ...extra,
  });
}

export const AuthProvider = ({ children }) => {
  const bootLocal = localClinicAtBoot();
  const [user, setUser] = useState(bootLocal ? LOCAL_CLINIC_USER : null);
  const [isAuthenticated, setIsAuthenticated] = useState(bootLocal);
  const [isLoadingAuth, setIsLoadingAuth] = useState(!bootLocal);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(!bootLocal);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(bootLocal);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  const enterLocalClinic = (persist = true) => {
    if (persist) enableLocalClinic();
    setPilotMode(true);
    setUser(LOCAL_CLINIC_USER);
    setIsAuthenticated(true);
    setAuthChecked(true);
    setAuthError(null);
    setIsLoadingAuth(false);
    setIsLoadingPublicSettings(false);
  };

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    if (localClinicAtBoot()) {
      enterLocalClinic(false);
      return;
    }

    if (isStandaloneBuild()) {
      if (getAuthMode() === AUTH_MODES.SUPABASE) {
        try {
          setIsLoadingAuth(true);
          const cached = loadStoredSession();
          if (cached?.access_token) {
            const user = await fetchCurrentUser();
            if (user) {
              setUser(user);
              setIsAuthenticated(true);
              setAuthChecked(true);
              setIsLoadingAuth(false);
              setIsLoadingPublicSettings(false);
              return;
            }
          }
        } catch (e) {
          console.error('Supabase session check failed:', e);
        }
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
        setIsLoadingPublicSettings(false);
        return;
      }
      enterLocalClinic(false);
      return;
    }
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await withDeadline(
          appClient.get(`/prod/public-settings/by-id/${appParams.appId}`),
        );
        setAppPublicSettings(publicSettings);
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await withDeadline(checkUserAuth());
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
          setIsLoadingPublicSettings(false);
          setIsLoadingAuth(false);
          setAuthChecked(true);
          return;
        }
        // Credits exhausted, quota, proxy down, or no network → run on this device.
        enterLocalClinic(true);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      enterLocalClinic(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      if (getAuthMode() === AUTH_MODES.SUPABASE) {
        const user = await fetchCurrentUser();
        setUser(user);
        setIsAuthenticated(Boolean(user));
        setIsLoadingAuth(false);
        setAuthChecked(true);
        return;
      }
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = async (shouldRedirect = true) => {
    const wasLocal = Boolean(user?.local);
    const wasSupabase = Boolean(user?.supabase);
    disableLocalClinic();
    setUser(null);
    setIsAuthenticated(false);
    if (wasLocal) {
      if (shouldRedirect && typeof window !== 'undefined') window.location.href = absoluteAppPath('/login');
      return;
    }
    if (wasSupabase || getAuthMode() === AUTH_MODES.SUPABASE) {
      await logoutHosted();
      if (shouldRedirect && typeof window !== 'undefined') window.location.href = absoluteAppPath('/login');
      return;
    }
    if (shouldRedirect) {
      base44.auth.logout('/login');
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      enterLocalClinic,
      isLocalClinic: Boolean(user?.local),
      authMode: getAuthMode(),
      supportsEmailAuth: getAuthMode() !== AUTH_MODES.LOCAL,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
