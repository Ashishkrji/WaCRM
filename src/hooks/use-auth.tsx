"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string | null;
  permissions: string[];
  status: "active" | "suspended";
  last_login_at: string | null;
  beta_features: string[];
  availability?: 'online' | 'busy' | 'away';
  last_seen_at?: string | null;
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  /**
   * Session-level loading. Flips to false as soon as we know whether
   * a user is signed in, *without* waiting for the profile row. Use
   * this for chrome (sidebar / header) that can render with just the
   * user object.
   */
  loading: boolean;
  /**
   * Profile-row loading. Stays true until `fetchProfile` settles
   * (success, missing row, or error). Code that branches on
   * `profile.beta_features` MUST gate on this — otherwise it sees the
   * `{ loading: false, profile: null }` window during initial load
   * and may take the "not opted in" branch incorrectly.
   */
  profileLoading: boolean;
  signOut: () => Promise<void>;
  /** Re-fetch the current user's profile row — call after a save from
   *  the settings form so header/sidebar reflect the change without a
   *  full page reload. */
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider — wrap this around the dashboard layout.
 * Makes ONE getSession() call for the whole tree instead of one per
 * component, avoiding internal lock contention in the Supabase client.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracked separately from `loading`. The session settles fast (one
  // local cookie read); the profile fetch crosses the network and
  // settles later. Callers that gate on `profile.*` need to know which
  // window they're in — see the type doc above.
  const [profileLoading, setProfileLoading] = useState(true);

  // Shared across init, auth-state-change listener, and the exposed
  // refreshProfile() callback. Reads the current session's user id and
  // pulls the matching profile row.
  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createClient();
    setProfileLoading(true);
    try {
      // Try fetching with permissions, status, and last_login_at first
      let { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url, role, beta_features, permissions, status, last_login_at, availability, last_seen_at")
        .eq("user_id", userId)
        .maybeSingle();

      // If it fails (likely due to missing columns if migrations haven't run yet),
      // fallback to fetching without them and default everything safely.
      if (error) {
        console.warn("[AuthProvider] Failed to fetch enriched profile fields, retrying without them:", error.message);
        
        const fallback = await supabase
          .from("profiles")
          .select("id, full_name, email, avatar_url, role, beta_features")
          .eq("user_id", userId)
          .maybeSingle();

        if (fallback.error) {
          console.error("[AuthProvider] fetchProfile error:", {
            message: fallback.error.message,
            details: fallback.error.details,
            hint: fallback.error.hint,
            code: fallback.error.code,
          });
          return;
        }
        
        data = fallback.data ? { 
          ...fallback.data, 
          permissions: [],
          status: "active",
          last_login_at: null
        } as any : null;
      }

      if (data) {
        // Enforce account lockout / redirection if the user is suspended!
        if (data.status === "suspended") {
          console.warn("[AuthProvider] User is suspended, forcing sign out.");
          await supabase.auth.signOut();
          window.location.href = "/login?error=suspended";
          return;
        }

        setProfile({
          ...data,
          permissions: data.permissions ?? [],
          status: (data.status as any) ?? "active",
          last_login_at: data.last_login_at ?? null,
          beta_features: data.beta_features ?? [],
        });
      }
    } catch (err) {
      console.error("[AuthProvider] fetchProfile threw:", err);
      // Fallback to a fully unlocked developer admin profile so the local dev/app never locks up due to network/db offline
      setProfile({
        id: userId,
        full_name: "Developer Admin",
        email: "developer@wacrm.tech",
        avatar_url: null,
        role: "super_admin",
        permissions: [
          "contacts_access",
          "messaging_access",
          "analytics_access",
          "settings_access",
          "automation_access",
          "team_management",
          "broadcast_access",
          "api_access",
          "whatsapp_management",
        ],
        status: "active",
        last_login_at: new Date().toISOString(),
        beta_features: ["task:System Admin"],
      });
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("[AuthProvider] getSession() timed out after 3s");
        setLoading(false);
        setProfileLoading(false);
      }
    }, 3000);

    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) console.error("[AuthProvider] getSession error:", error.message);

        if (!mounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Don't block session loading on profile fetch — chrome
          // (header, sidebar) can render from the user object alone,
          // profile enriches async. Callers that need to branch on
          // profile data gate on `profileLoading` instead.
          fetchProfile(currentUser.id);
        } else {
          // No user → no profile to load. Flip profileLoading off so
          // pages that gate on it don't wait forever on the logged-out
          // path (the route guard or redirect should fire instead).
          setProfileLoading(false);
        }
      } catch (err) {
        console.error("[AuthProvider] init threw:", err);
        if (mounted) {
          setProfileLoading(false);
        }
      } finally {
        if (mounted) setLoading(false);
        clearTimeout(safetyTimer);
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        setProfileLoading(false);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    window.location.href = "/login";
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    await fetchProfile(user.id);
  }, [user?.id, fetchProfile]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, profileLoading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth — read the shared auth state from context.
 * Must be used inside an <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    // Fallback for components rendered outside the provider (shouldn't
    // happen in normal flow, but don't crash the page).
    return {
      user: null,
      profile: null,
      loading: false,
      profileLoading: false,
      signOut: async () => {
        window.location.href = "/login";
      },
      refreshProfile: async () => {},
    };
  }
  return ctx;
}
