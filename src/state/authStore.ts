import { create } from 'zustand';
import { supabase } from '../data/remote/supabase';
import { Session, User } from '@supabase/supabase-js';
import { BusinessMember, Business } from '../domain/types';
import { membersRepo, businessRepo } from '../data/local/repos';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
    session: Session | null;
    user: User | null;
    role: 'admin' | 'staff' | null;
    activeBusinessId: string | null;
    isLoading: boolean;

    // Actions
    signIn: (email: string, pass: string) => Promise<{ error?: any }>;
    signUp: (email: string, pass: string) => Promise<{ error?: any }>;
    signOut: () => Promise<void>;
    checkSession: () => Promise<void>;
    loadProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    session: null,
    user: null,
    role: null,
    activeBusinessId: null,
    isLoading: true,

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error };
        // Profile loading happens in onAuthStateChange usually, but we force it here for immediate feedback
        if (data.user) {
            await get().loadProfile(data.user.id);
        }
        return { error: undefined };
    },

    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { error };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null, role: null, activeBusinessId: null });
    },

    loadProfile: async (userId: string) => {
        // 1. Check local DB for membership first (offline speed)
        let members = membersRepo.getByUserId(userId);

        // 2. If empty, try fetching from remote (first time login)
        if (members.length === 0) {
            const { data } = await supabase.from('business_members').select('*').eq('user_id', userId);
            if (data && data.length > 0) {
                // Fetch associated businesses first to satisfy Foreign Key
                const businessIds = data.map(m => m.business_id);
                const { data: businessData } = await supabase.from('businesses').select('*').in('id', businessIds);

                if (businessData) {
                    businessData.forEach((b: any) => businessRepo.saveSynced(b));
                }

                // Sync to local - ONLY if business exists to avoid FK crash
                data.forEach(m => {
                    const businessExists = businessRepo.getById(m.business_id);
                    if (businessExists) {
                        membersRepo.saveSynced(m as BusinessMember);
                    }
                });

                // Re-fetch from local to ensure we have valid objects
                members = membersRepo.getByUserId(userId);
            }
        }

        if (members.length > 0) {
            // MVP: Pick first business. Multi-business is v2.
            const current = members[0];
            set({
                role: current.role,
                activeBusinessId: current.business_id
            });
        } else {
            // No business found -> User needs onboarding
            set({ role: null, activeBusinessId: null });
        }
    },

    checkSession: async () => {
        set({ isLoading: true });
        try {
            // Resume session
            const { data } = await supabase.auth.getSession();

            if (data.session) {
                set({ session: data.session, user: data.session.user });
                await get().loadProfile(data.session.user.id);
            } else {
                set({ session: null, user: null });
            }
        } catch (error) {
            console.error('Session check failed:', error);
            set({ session: null, user: null });
        } finally {
            set({ isLoading: false });
        }
    },
}));

// Initialize listener
supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
        useAuthStore.getState().checkSession();
    }
});
