export type AppRole = 'admin' | 'staff';
export type ShiftStatus = 'draft' | 'published' | 'canceled';
export type RequestType = 'time_off' | 'swap';
export type RequestStatus = 'pending' | 'approved' | 'declined';
export type SyncStatus = 'synced' | 'pending' | 'failed';

export interface Business {
    id: string;
    name: string;
    timezone: string;
    late_threshold_minutes: number;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    sync_status?: SyncStatus;
}

export interface BusinessMember {
    id: string;
    user_id: string;
    business_id: string;
    role: AppRole;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    sync_status?: SyncStatus;
}

export interface Staff {
    id: string;
    business_id: string;
    user_id?: string | null;
    name: string;
    role: AppRole;
    hourly_rate: number;
    active: boolean; // stored as 0/1 in SQLite, requires conversion
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    sync_status?: SyncStatus;
}

export interface Shift {
    id: string;
    business_id: string;
    staff_id: string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM:SS
    end_time: string; // HH:MM:SS
    status: ShiftStatus;
    notes?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    sync_status?: SyncStatus;
}

export interface TimeEntry {
    id: string;
    shift_id: string;
    staff_id: string;
    clock_in: string; // ISO
    clock_out?: string | null; // ISO
    minutes_late: number;
    total_minutes: number;
    source: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    sync_status?: SyncStatus;
}

export interface Request {
    id: string;
    business_id: string;
    staff_id: string;
    type: RequestType;
    start_date: string;
    end_date: string;
    reason?: string | null;
    status: RequestStatus;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    sync_status?: SyncStatus;
}
