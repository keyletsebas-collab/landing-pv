import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user'); 
  const [status, setStatus] = useState('active');

  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading screens
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth timeout: forcing loading = false');
        setLoading(false);
      }
    }, 6000);

    // Initial session check
    supabase.auth.getSession().then((response) => {
      if (!mounted) return;
      const session = response?.data?.session ?? null;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserRoleAndStatus(currentUser.id);
      } else {
        const envEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
        if (envEmail && envPassword) {
          supabase.auth.signInWithPassword({
            email: envEmail,
            password: envPassword
          }).then(({ error }) => {
            if (error) {
              console.error('Auto login failed:', error);
              if (mounted) setLoading(false);
            }
          }).catch(err => {
            console.error('Auto login exception:', err);
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }
    }).catch(err => {
      console.error('Session check error:', err);
      if (mounted) setLoading(false);
    });

    // Listen to Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRoleAndStatus(currentUser.id);
      } else {
        setRole('user');
        setStatus('active');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const fetchUserRoleAndStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', userId)
        .single();
      
      if (data) {
        if (data.status === 'inactive') {
          // Force sign out immediately if inactive
          await supabase.auth.signOut();
          setUser(null);
          setRole('user');
          setStatus('inactive');
          alert('Tu cuenta ha sido inhabilitada por un administrador.');
          setLoading(false);
          return;
        }
        setRole(data.role || 'user');
        setStatus(data.status || 'active');
      } else {
        // Fallback if no profile row exists
        setRole('user');
        setStatus('active');
      }
    } catch (err) {
      console.error('Error fetching role and status:', err);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setRole('user');
    setStatus('active');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, status, loading, logout, fetchUserRoleAndStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
