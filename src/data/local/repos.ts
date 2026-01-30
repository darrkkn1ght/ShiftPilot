import { db } from './db';
import { Business, BusinessMember, Staff, Shift, TimeEntry, Request, SyncStatus } from '../../domain/types';
import * as Crypto from 'expo-crypto';

const generateId = () => Crypto.randomUUID();
const now = () => new Date().toISOString();

// Generic helper for base update logic
const getBaseInsert = () => ({
    created_at: now(),
    updated_at: now(),
    sync_status: 'pending' as SyncStatus,
});

const getBaseUpdate = () => ({
    updated_at: now(),
    sync_status: 'pending' as SyncStatus,
});

// -----------------------------------------------------------------------------
// Business Repo
// -----------------------------------------------------------------------------
export const businessRepo = {
    getById: (id: string): Business | null => {
        return db.getFirstSync<Business>('SELECT * FROM businesses WHERE id = ?', [id]);
    },

    create: (business: Omit<Business, 'id' | 'created_at' | 'updated_at' | 'sync_status'>): Business => {
        const id = generateId();
        const meta = getBaseInsert();
        const newBusiness: Business = { ...business, id, ...meta };

        db.runSync(
            `INSERT INTO businesses (id, name, timezone, late_threshold_minutes, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newBusiness.id, newBusiness.name, newBusiness.timezone, newBusiness.late_threshold_minutes, newBusiness.created_at, newBusiness.updated_at, newBusiness.sync_status!]
        );
        return newBusiness;
    },

    update: (id: string, updates: Partial<Omit<Business, 'id'>>): void => {
        const meta = getBaseUpdate();
        const keys = Object.keys(updates);
        if (keys.length === 0) return;

        const setClause = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = ?, sync_status = ?';
        const values = [...Object.values(updates), meta.updated_at, meta.sync_status, id];

        db.runSync(`UPDATE businesses SET ${setClause} WHERE id = ?`, values);
    },

    saveSynced: (business: Business): void => {
        db.runSync(
            `INSERT OR REPLACE INTO businesses (id, name, timezone, late_threshold_minutes, created_at, updated_at, sync_status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [business.id, business.name, business.timezone, business.late_threshold_minutes, business.created_at, business.updated_at, 'synced']
        );
    }
};

// -----------------------------------------------------------------------------
// Members Repo
// -----------------------------------------------------------------------------
export const membersRepo = {
    getByUserId: (userId: string): BusinessMember[] => {
        return db.getAllSync<BusinessMember>('SELECT * FROM business_members WHERE user_id = ?', [userId]);
    },

    create: (member: Omit<BusinessMember, 'id' | 'created_at' | 'updated_at' | 'sync_status'>): BusinessMember => {
        const id = generateId();
        const meta = getBaseInsert();
        const newMember = { ...member, id, ...meta };

        db.runSync(
            `INSERT INTO business_members (id, user_id, business_id, role, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [newMember.id, newMember.user_id, newMember.business_id, newMember.role, newMember.created_at, newMember.updated_at, newMember.sync_status]
        );
        return newMember;
    },

    saveSynced: (member: BusinessMember): void => {
        db.runSync(
            `INSERT OR REPLACE INTO business_members (id, user_id, business_id, role, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [member.id, member.user_id, member.business_id, member.role, member.created_at, member.updated_at, 'synced']
        );
    }
};

// -----------------------------------------------------------------------------
// Staff Repo
// -----------------------------------------------------------------------------
export const staffRepo = {
    getByBusinessId: (businessId: string): Staff[] => {
        // Handling boolean conversion if needed, though expo-sqlite usually handles int/bool ok
        const res = db.getAllSync<Staff>('SELECT * FROM staff WHERE business_id = ? AND deleted_at IS NULL', [businessId]);
        return res.map(s => ({ ...s, active: Boolean(s.active) }));
    },

    getByUserAndBusiness: (userId: string, businessId: string): Staff | null => {
        const res = db.getFirstSync<Staff>('SELECT * FROM staff WHERE user_id = ? AND business_id = ?', [userId, businessId]);
        return res ? { ...res, active: Boolean(res.active) } : null;
    },

    getById: (id: string): Staff | null => {
        const res = db.getFirstSync<Staff>('SELECT * FROM staff WHERE id = ?', [id]);
        return res ? { ...res, active: Boolean(res.active) } : null;
    },

    create: (staff: Omit<Staff, 'id' | 'created_at' | 'updated_at' | 'sync_status'>): Staff => {
        const id = generateId();
        const meta = getBaseInsert();
        // Ensure active is 1 or 0
        const activeInt = staff.active ? 1 : 0;
        const newStaff = { ...staff, id, ...meta };

        db.runSync(
            `INSERT INTO staff (id, business_id, user_id, name, role, hourly_rate, active, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newStaff.id, newStaff.business_id, newStaff.user_id || null, newStaff.name, newStaff.role, newStaff.hourly_rate, activeInt, newStaff.created_at, newStaff.updated_at, newStaff.sync_status]
        );
        return newStaff;
    }
};

// -----------------------------------------------------------------------------
// Shifts Repo
// -----------------------------------------------------------------------------
export const shiftsRepo = {
    getByDateRange: (businessId: string, startDate: string, endDate: string): Shift[] => {
        return db.getAllSync<Shift>(
            `SELECT * FROM shifts WHERE business_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date, start_time`,
            [businessId, startDate, endDate]
        );
    },

    getTodayShift: (businessId: string, staffId: string, date: string): Shift | null => {
        return db.getFirstSync<Shift>(
            `SELECT * FROM shifts WHERE business_id = ? AND staff_id = ? AND date = ? AND deleted_at IS NULL AND status = 'published'`,
            [businessId, staffId, date]
        );
    },

    create: (shift: Omit<Shift, 'id' | 'created_at' | 'updated_at' | 'sync_status'>): Shift => {
        const id = generateId();
        const meta = getBaseInsert();
        const newShift = { ...shift, id, ...meta };

        db.runSync(
            `INSERT INTO shifts (id, business_id, staff_id, date, start_time, end_time, status, notes, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newShift.id, newShift.business_id, newShift.staff_id, newShift.date, newShift.start_time, newShift.end_time, newShift.status, newShift.notes || null, newShift.created_at, newShift.updated_at, newShift.sync_status]
        );
        return newShift;
    },

    flagCoverage: (businessId: string, staffId: string, startDate: string, endDate: string): void => {
        const meta = getBaseUpdate();
        // Assuming logic: Flag all shifts for this staff in range as needing coverage
        // In a real app we might verify shift times vs request times, but Date range enough for MVP
        db.runSync(
            `UPDATE shifts 
       SET needs_coverage = 1, updated_at = ?, sync_status = ? 
       WHERE business_id = ? AND staff_id = ? AND date >= ? AND date <= ?`,
            [meta.updated_at, meta.sync_status, businessId, staffId, startDate, endDate]
        );
    },

    updateStatus: (id: string, status: Shift['status']): void => {
        const meta = getBaseUpdate();
        db.runSync(`UPDATE shifts SET status = ?, updated_at = ?, sync_status = ? WHERE id = ?`, [status, meta.updated_at, meta.sync_status, id]);
    },

    update: (id: string, updates: Partial<Omit<Shift, 'id' | 'created_at'>>): void => {
        const meta = getBaseUpdate();
        const keys = Object.keys(updates);
        if (keys.length === 0) return;

        const setClause = keys.map(k => `${k} = ?`).join(', ') + ', updated_at = ?, sync_status = ?';
        const values = [...Object.values(updates), meta.updated_at, meta.sync_status, id];

        db.runSync(`UPDATE shifts SET ${setClause} WHERE id = ?`, values);
    }
};

// -----------------------------------------------------------------------------
// Time Entries Repo
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Time Entries Repo
// -----------------------------------------------------------------------------
export const timeEntriesRepo = {
    getOpenEntry: (staffId: string): TimeEntry | null => {
        return db.getFirstSync<TimeEntry>(
            `SELECT * FROM time_entries WHERE staff_id = ? AND clock_out IS NULL ORDER BY clock_in DESC`,
            [staffId]
        );
    },

    getByShiftId: (shiftId: string): TimeEntry | null => {
        return db.getFirstSync<TimeEntry>('SELECT * FROM time_entries WHERE shift_id = ?', [shiftId]);
    },

    getCurrentlyClockedIn: (businessId: string): TimeEntry[] => {
        return db.getAllSync<TimeEntry>(
            `SELECT te.* FROM time_entries te
           JOIN staff s ON te.staff_id = s.id
           WHERE s.business_id = ? AND te.clock_out IS NULL`,
            [businessId]
        );
    },

    getByDateRange: (businessId: string, startDate: string, endDate: string): TimeEntry[] => {
        return db.getAllSync<TimeEntry>(
            `SELECT te.* FROM time_entries te
           JOIN staff s ON te.staff_id = s.id
           WHERE s.business_id = ? AND te.clock_in >= ? AND te.clock_in <= ?`,
            [businessId, startDate, endDate + 'T23:59:59']
        );
    },

    search: (businessId: string, filters: { staffId?: string, isLate?: boolean }): TimeEntry[] => {
        let query = `
        SELECT te.* 
        FROM time_entries te
        JOIN staff s ON te.staff_id = s.id
        WHERE s.business_id = ?
      `;
        const params: any[] = [businessId];

        if (filters.staffId) {
            query += ` AND te.staff_id = ?`;
            params.push(filters.staffId);
        }
        if (filters.isLate) {
            query += ` AND te.minutes_late > 0`;
        }

        query += ` ORDER BY te.clock_in DESC LIMIT 50`;

        return db.getAllSync<TimeEntry>(query, params);
    },

    clockIn: (entry: Omit<TimeEntry, 'id' | 'created_at' | 'updated_at' | 'sync_status' | 'clock_out' | 'total_minutes' | 'minutes_late'>): TimeEntry => {
        const id = generateId();
        const meta = getBaseInsert();
        const newEntry: TimeEntry = {
            ...entry,
            id,
            clock_out: null,
            minutes_late: 0,
            total_minutes: 0,
            ...meta
        };

        db.runSync(
            `INSERT INTO time_entries (id, shift_id, staff_id, clock_in, source, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [newEntry.id, newEntry.shift_id, newEntry.staff_id, newEntry.clock_in, newEntry.source, newEntry.created_at, newEntry.updated_at, newEntry.sync_status!]
        );
        return newEntry;
    },

    clockOut: (id: string, clockOutTime: string, totalMinutes: number): void => {
        const meta = getBaseUpdate();
        db.runSync(
            `UPDATE time_entries SET clock_out = ?, total_minutes = ?, updated_at = ?, sync_status = ? WHERE id = ?`,
            [clockOutTime, totalMinutes, meta.updated_at, meta.sync_status, id]
        );
    },

    updateLate: (id: string, minutesLate: number): void => {
        const meta = getBaseUpdate();
        db.runSync(
            `UPDATE time_entries SET minutes_late = ?, updated_at = ?, sync_status = ? WHERE id = ?`,
            [minutesLate, meta.updated_at, meta.sync_status, id]
        );
    }
};

// -----------------------------------------------------------------------------
// Requests Repo
// -----------------------------------------------------------------------------
export const requestsRepo = {
    getPending: (businessId: string): Request[] => {
        return db.getAllSync<Request>(
            `SELECT * FROM requests WHERE business_id = ? AND status = 'pending' ORDER BY start_date`,
            [businessId]
        );
    },

    getByStaff: (staffId: string): Request[] => {
        return db.getAllSync<Request>(
            `SELECT * FROM requests WHERE staff_id = ? ORDER BY start_date DESC`,
            [staffId]
        );
    },

    create: (req: Omit<Request, 'id' | 'created_at' | 'updated_at' | 'sync_status'>): Request => {
        const id = generateId();
        const meta = getBaseInsert();
        const newReq = { ...req, id, ...meta };

        db.runSync(
            `INSERT INTO requests (id, business_id, staff_id, type, start_date, end_date, reason, status, created_at, updated_at, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [newReq.id, newReq.business_id, newReq.staff_id, newReq.type, newReq.start_date, newReq.end_date, newReq.reason || null, newReq.status, newReq.created_at, newReq.updated_at, newReq.sync_status!]
        );
        return newReq;
    },

    updateStatus: (id: string, status: Request['status']): void => {
        const meta = getBaseUpdate();
        db.runSync(
            `UPDATE requests SET status = ?, updated_at = ?, sync_status = ? WHERE id = ?`,
            [status, meta.updated_at, meta.sync_status, id]
        );
    }
};
