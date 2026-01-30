import { differenceInMinutes, parseISO, startOfDay, parse } from 'date-fns';

/**
 * Calculates minutes late.
 * If early or on time (within threshold), returns 0.
 * @param shiftDateStr YYYY-MM-DD
 * @param shiftStartTime HH:MM or HH:MM:SS
 * @param clockInISO ISO string
 * @param thresholdMinutes integer
 */
export const calculateLateness = (
    shiftDateStr: string,
    shiftStartTime: string,
    clockInISO: string,
    thresholdMinutes: number
): number => {
    // Construct Shift Start Date Object
    // We assume shift is in business timezone, but for MVP we assume local/device time syncs or UTC.
    // Ideally we use date-fns-tz but let's stick to simple date construction for MVP
    const shiftStart = new Date(`${shiftDateStr}T${shiftStartTime}`);
    const clockIn = new Date(clockInISO);

    const diff = differenceInMinutes(clockIn, shiftStart);

    // If late by more than threshold
    if (diff > thresholdMinutes) {
        return diff;
    }
    return 0;
};

/**
 * Calculates total minutes worked.
 */
export const calculateDuration = (clockInISO: string, clockOutISO: string): number => {
    const start = new Date(clockInISO);
    const end = new Date(clockOutISO);
    return Math.max(0, differenceInMinutes(end, start));
};

export const formatDuration = (minutes: number): string => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};
