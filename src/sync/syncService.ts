import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../data/local/db';
import { supabase } from '../data/remote/supabase';
import { Business, Staff, Shift, TimeEntry, Request } from '../domain/types';

// Storage Keys
const LAST_SYNC_KEY_PREFIX = 'shiftpilot_last_sync_';

// Track Sync State
export const syncState = {
    isSyncing: false,
};

// -- Helpers --
const getLastSync = async (businessId: string): Promise<string | null> => {
    return await AsyncStorage.getItem(`${LAST_SYNC_KEY_PREFIX}${businessId}`);
};

const setLastSync = async (businessId: string, timestamp: string) => {
    await AsyncStorage.setItem(`${LAST_SYNC_KEY_PREFIX}${businessId}`, timestamp);
};

// -- Push Logic (Local -> Remote) --
const pushPendingChanges = async (businessId: string) => {
    console.log('[Sync] Starting Push...');

    // 1. Businesses
    const pendingBiz = db.getAllSync<Business>(
        `SELECT * FROM businesses WHERE sync_status = 'pending' AND id = ?`, [businessId]
    );
    if (pendingBiz.length > 0) {
        const { error } = await supabase.from('businesses').upsert(
            pendingBiz.map(b => ({ ...b, sync_status: undefined })) // Remove local-only field
        );
        if (!error) {
            const ids = pendingBiz.map(b => b.id);
            db.execSync(`UPDATE businesses SET sync_status = 'synced' WHERE id IN ('${ids.join("','")}')`);
        } else {
            console.error('[Sync] Push Business Error:', error);
        }
    }

    // 2. Staff
    const pendingStaff = db.getAllSync<Staff>(
        `SELECT * FROM staff WHERE sync_status = 'pending' AND business_id = ?`, [businessId]
    );
    if (pendingStaff.length > 0) {
        // Map active back to boolean for Supabase if needed, but PG handles 0/1 usually
        // Ideally defined in remote schema as boolean. Supabase JS client handles it.
        const { error } = await supabase.from('staff').upsert(
            pendingStaff.map(s => ({ ...s, sync_status: undefined, active: Boolean(s.active) }))
        );
        if (!error) {
            const ids = pendingStaff.map(s => s.id);
            db.execSync(`UPDATE staff SET sync_status = 'synced' WHERE id IN ('${ids.join("','")}')`);
        } else {
            console.error('[Sync] Push Staff Error:', error);
        }
    }

    // 3. Shifts
    const pendingShifts = db.getAllSync<Shift>(
        `SELECT * FROM shifts WHERE sync_status = 'pending' AND business_id = ?`, [businessId]
    );
    if (pendingShifts.length > 0) {
        const { error } = await supabase.from('shifts').upsert(
            pendingShifts.map(s => ({ ...s, sync_status: undefined }))
        );
        if (!error) {
            const ids = pendingShifts.map(s => s.id);
            db.execSync(`UPDATE shifts SET sync_status = 'synced' WHERE id IN ('${ids.join("','")}')`);
        } else {
            console.error('[Sync] Push Shifts Error:', error);
        }
    }

    // 4. Time Entries (Join shifts to filter by business, tricky in SQLite update if generic)
    // Simplified: We assume current business scope.
    // Fetch pending time entries where related shift belongs to this business
    const pendingEntries = db.getAllSync<TimeEntry & { business_id: string }>(
        `SELECT te.*, s.business_id 
     FROM time_entries te 
     JOIN shifts s ON te.shift_id = s.id 
     WHERE te.sync_status = 'pending' AND s.business_id = ?`, [businessId]
    );

    if (pendingEntries.length > 0) {
        const cleanEntries = pendingEntries.map(({ business_id, ...te }) => ({ ...te, sync_status: undefined }));
        const { error } = await supabase.from('time_entries').upsert(cleanEntries);
        if (!error) {
            const ids = pendingEntries.map(e => e.id);
            db.execSync(`UPDATE time_entries SET sync_status = 'synced' WHERE id IN ('${ids.join("','")}')`);
        } else {
            console.error('[Sync] Push TimeEntries Error:', error);
        }
    }

    // 5. Requests
    const pendingRequests = db.getAllSync<Request>(
        `SELECT * FROM requests WHERE sync_status = 'pending' AND business_id = ?`, [businessId]
    );
    if (pendingRequests.length > 0) {
        const { error } = await supabase.from('requests').upsert(
            pendingRequests.map(r => ({ ...r, sync_status: undefined }))
        );
        if (!error) {
            const ids = pendingRequests.map(r => r.id);
            db.execSync(`UPDATE requests SET sync_status = 'synced' WHERE id IN ('${ids.join("','")}')`);
        } else {
            console.error('[Sync] Push Requests Error:', error);
        }
    }
};

// -- Pull Logic (Remote -> Local) --
const pullChanges = async (businessId: string) => {
    const lastSync = await getLastSync(businessId);
    const now = new Date().toISOString();
    console.log(`[Sync] Pulling changes since ${lastSync || 'beginning'}...`);

    // Helper to merge
    const mergeData = (table: string, data: any[], pk = 'id') => {
        if (!data || data.length === 0) return;

        db.withTransactionSync(() => {
            data.forEach(item => {
                // Check local
                const local = db.getFirstSync<any>(`SELECT updated_at, sync_status FROM ${table} WHERE ${pk} = ?`, [item[pk]]);

                let shouldUpdate = true;
                if (local) {
                    const localDate = new Date(local.updated_at).getTime();
                    const remoteDate = new Date(item.updated_at).getTime();
                    // Conflict: if pending local changes, last write wins based on time
                    if (local.sync_status === 'pending' && localDate > remoteDate) {
                        shouldUpdate = false;
                    }
                }

                if (shouldUpdate) {
                    const cols = Object.keys(item).filter(k => k !== 'sync_status'); // Don't pull sync_status
                    const placeholders = cols.map(() => '?').join(',');
                    const setClause = cols.map(c => `${c}=?`).join(',');
                    const values = cols.map(c => item[c]);
                    const valsWithStatus = [...values, 'synced']; // Force synced status on pull

                    // Upsert equivalent in SQLite is tricky, standardizing on REPLACE/INSERT or manual check
                    // Using INSERT OR REPLACE
                    const colString = cols.join(', ') + ', sync_status';
                    db.runSync(
                        `INSERT OR REPLACE INTO ${table} (${colString}) VALUES (${placeholders}, ?)`,
                        valsWithStatus
                    );
                }
            });
        });
    };

    // 1. Staff
    let query = supabase.from('staff').select('*').eq('business_id', businessId);
    if (lastSync) query = query.gt('updated_at', lastSync);
    const { data: staffData } = await query;
    // Convert boolean active -> 0/1 for SQLite if needed, but expo-sqlite handles 1/0 for bools better implicitly
    const safeStaffData = staffData?.map(s => ({ ...s, active: s.active ? 1 : 0 }));
    mergeData('staff', safeStaffData || []);

    // 2. Shifts
    let shiftQuery = supabase.from('shifts').select('*').eq('business_id', businessId);
    if (lastSync) shiftQuery = shiftQuery.gt('updated_at', lastSync);
    const { data: shiftData } = await shiftQuery;
    mergeData('shifts', shiftData || []);

    // 3. Requests
    let reqQuery = supabase.from('requests').select('*').eq('business_id', businessId);
    if (lastSync) reqQuery = reqQuery.gt('updated_at', lastSync);
    const { data: reqData } = await reqQuery;
    mergeData('requests', reqData || []);

    // 4. TimeEntries (Linked)
    // Harder to filter by businessId directly if not on table, but our data model has business_id on Staff/Shift?
    // Schema check: TimeEntry does NOT have business_id. We must rely on joining or just pulling blindly if RLS is set.
    // Assuming RLS restricts us to only see time entries for this business anyway.
    let teQuery = supabase.from('time_entries').select('*');
    if (lastSync) teQuery = teQuery.gt('updated_at', lastSync);
    const { data: teData } = await teQuery;
    // Filter by business logic if RLS doesn't catch it, but trust RLS.
    // Actually, wait, client might fetch ALL time entries if multiple businesses?
    // User is scoped to ONE business in MVP.
    mergeData('time_entries', teData || []);

    await setLastSync(businessId, now);
};

// -- Main Sync Function --
export const syncNow = async (businessId: string) => {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
        console.log('[Sync] Offline. Skipping.');
        return;
    }

    if (syncState.isSyncing) {
        console.log('[Sync] Already in progress.');
        return;
    }

    try {
        syncState.isSyncing = true;
        // 1. Push Local -> Remote
        await pushPendingChanges(businessId);

        // 2. Pull Remote -> Local
        await pullChanges(businessId);

        console.log('[Sync] Complete.');
    } catch (e) {
        console.error('[Sync] Failed:', e);
    } finally {
        syncState.isSyncing = false;
    }
};
