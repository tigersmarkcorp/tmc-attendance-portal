import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'employee' | 'site_admin_officer';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  employeeId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const fetchUserRole = async (userId: string): Promise<AppRole | null> => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    const userRole = data?.role as AppRole | null;
    setRole(userRole);
    return userRole;
  };

  const fetchEmployeeId = async (userId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    const empId = data?.id ?? null;
    setEmployeeId(empId);
    return empId;
  };

  useEffect(() => {
    let isMounted = true;

    // Initial session load - wait for role before setting loading to false
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Await role and employeeId before completing initial load
          await Promise.all([
            fetchUserRole(session.user.id),
            fetchEmployeeId(session.user.id),
          ]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes AFTER initial load
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fire and forget for ongoing changes (don't block on these)
          fetchUserRole(session.user.id);
          fetchEmployeeId(session.user.id);
        } else {
          setRole(null);
          setEmployeeId(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setEmployeeId(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, employeeId, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
