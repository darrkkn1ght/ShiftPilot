import { TimeEntry, Staff } from './types';

export interface PayrollReportItem {
    staffId: string;
    staffName: string;
    hourlyRate: number;
    totalMinutes: number;
    totalHours: number;
    lateCount: number;
    estimatedPay: number;
}

export const generatePayrollReport = (
    staffList: Staff[],
    entries: TimeEntry[]
): PayrollReportItem[] => {
    // 1. Initialize map
    const reportMap: Record<string, PayrollReportItem> = {};

    staffList.forEach(s => {
        reportMap[s.id] = {
            staffId: s.id,
            staffName: s.name,
            hourlyRate: s.hourly_rate,
            totalMinutes: 0,
            totalHours: 0,
            lateCount: 0,
            estimatedPay: 0,
        };
    });

    // 2. Aggregate Entries
    entries.forEach(entry => {
        const item = reportMap[entry.staff_id];
        if (item) {
            // Only count completed sessions or active ones? 
            // Usually payroll counts "total_minutes" which is updated on clock out.
            // If clock_out is null, total_minutes is 0 in our schema init.
            item.totalMinutes += entry.total_minutes;
            if (entry.minutes_late > 0) {
                item.lateCount += 1;
            }
        }
    });

    // 3. Final Calculations
    return Object.values(reportMap).map(item => {
        const hours = item.totalMinutes / 60;
        return {
            ...item,
            totalHours: parseFloat(hours.toFixed(2)),
            estimatedPay: parseFloat((hours * item.hourlyRate).toFixed(2)),
        };
    });
};
