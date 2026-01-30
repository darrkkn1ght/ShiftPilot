import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, Alert, ScrollView, RefreshControl } from 'react-native';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { staffRepo, shiftsRepo, timeEntriesRepo, businessRepo } from '../../data/local/repos';
import { Staff, Shift, TimeEntry } from '../../domain/types';
import { calculateLateness, calculateDuration, formatDuration } from '../../domain/attendance';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useFocusEffect } from '@react-navigation/native';
import { Clock, MapPin } from 'lucide-react-native';

export const TodayScreen = ({ navigation }: any) => {
    const { user, activeBusinessId } = useAuthStore();
    const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
    const [todayShift, setTodayShift] = useState<Shift | null>(null);
    const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null);
    const [completedEntry, setCompletedEntry] = useState<TimeEntry | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(() => {
        if (!user || !activeBusinessId) return;

        // 1. Get My Staff Profile
        const staff = staffRepo.getByUserAndBusiness(user.id, activeBusinessId);
        setCurrentStaff(staff);

        if (staff) {
            // 2. Get Today's Shift
            const today = new Date().toISOString().split('T')[0];
            const shift = shiftsRepo.getTodayShift(activeBusinessId, staff.id, today);
            setTodayShift(shift);

            // 3. Check for Open Entry
            const open = timeEntriesRepo.getOpenEntry(staff.id);
            setActiveEntry(open);

            // 4. Check for completed entry for this shift if no open one
            if (!open && shift) {
                const entry = timeEntriesRepo.getByShiftId(shift.id);
                if (entry && entry.clock_out) {
                    setCompletedEntry(entry);
                } else {
                    setCompletedEntry(null);
                }
            }
        }
        setRefreshing(false);
    }, [user, activeBusinessId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleClockIn = () => {
        if (!currentStaff || !todayShift || !activeBusinessId) return;

        const now = new Date().toISOString();
        const business = businessRepo.getById(activeBusinessId);

        // Calculate Late
        const minutesLate = calculateLateness(
            todayShift.date,
            todayShift.start_time,
            now,
            business?.late_threshold_minutes || 0
        );

        const entry = timeEntriesRepo.clockIn({
            shift_id: todayShift.id,
            staff_id: currentStaff.id,
            clock_in: now,
            source: 'mobile',
        });

        // Update with calculated late params
        if (minutesLate > 0) {
            timeEntriesRepo.updateLate(entry.id, minutesLate);
        }

        Alert.alert('Clocked In', minutesLate > 0 ? `You are ${minutesLate}m late.` : 'You are on time.');
        loadData();
    };

    const handleClockOut = () => {
        if (!activeEntry) return;

        const now = new Date().toISOString();
        const duration = calculateDuration(activeEntry.clock_in, now);

        timeEntriesRepo.clockOut(activeEntry.id, now, duration);
        Alert.alert('Clocked Out', `Total: ${formatDuration(duration)}`);
        loadData();
    };

    if (!currentStaff) {
        return (
            <SafeAreaView style={styles.container}>
                <OfflineBanner />
                <View style={styles.center}>
                    <Text style={{ color: 'white' }}>Staff profile not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <OfflineBanner />
            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
            >
                <Text style={styles.greeting}>Hi, {currentStaff.name.split(' ')[0]}</Text>
                <Text style={styles.date}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>

                {/* Shift Card */}
                {!todayShift ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyText}>No shifts scheduled for today.</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('MyShifts')}>
                            <Text style={styles.link}>View upcoming shifts</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.shiftCard}>
                        <View style={styles.shiftHeader}>
                            <Clock color={colors.primary} size={20} />
                            <Text style={styles.timeRange}>
                                {todayShift.start_time.slice(0, 5)} - {todayShift.end_time.slice(0, 5)}
                            </Text>
                        </View>
                        <View style={styles.roleData}>
                            <Text style={styles.role}>{currentStaff.role}</Text>
                            <Text style={styles.location}>Main Location</Text>
                        </View>
                        {todayShift.notes && <Text style={styles.notes}>{todayShift.notes}</Text>}
                    </View>
                )}

                {/* Action Area */}
                {todayShift && !completedEntry && (
                    <View style={styles.actionArea}>
                        {!activeEntry ? (
                            <TouchableOpacity style={styles.clockInBtn} onPress={handleClockIn}>
                                <Text style={styles.clockBtnText}>CLOCK IN</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.clockOutBtn} onPress={handleClockOut}>
                                <Text style={styles.clockBtnText}>CLOCK OUT</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Completed Summary */}
                {completedEntry && (
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryTitle}>Shift Complete</Text>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Duration</Text>
                            <Text style={styles.statValue}>{formatDuration(completedEntry.total_minutes)}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Status</Text>
                            <Text style={[styles.statValue, { color: completedEntry.minutes_late > 0 ? colors.warning : colors.success }]}>
                                {completedEntry.minutes_late > 0 ? `${completedEntry.minutes_late}m Late` : 'On Time'}
                            </Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    content: {
        padding: spacing.lg,
    },
    greeting: {
        fontSize: typography.sizes.h1,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    date: {
        fontSize: typography.sizes.body,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
    },
    emptyCard: {
        padding: spacing.xl,
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.card,
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    emptyText: {
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    link: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    shiftCard: {
        backgroundColor: colors.card,
        padding: spacing.lg,
        borderRadius: layout.borderRadius.card,
        marginBottom: spacing.xl,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
    },
    shiftHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
        gap: spacing.sm,
    },
    timeRange: {
        fontSize: typography.sizes.h2,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    roleData: {
        marginBottom: spacing.md,
    },
    role: {
        color: colors.text.primary,
        fontSize: typography.sizes.body,
        fontWeight: '600',
    },
    location: {
        color: colors.text.muted,
        fontSize: typography.sizes.caption,
    },
    notes: {
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    actionArea: {
        marginTop: spacing.md,
    },
    clockInBtn: {
        backgroundColor: colors.success,
        paddingVertical: 20,
        borderRadius: 100, // Pill/Circle feel
        alignItems: 'center',
        shadowColor: colors.success,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    clockOutBtn: {
        backgroundColor: colors.danger,
        paddingVertical: 20,
        borderRadius: 100,
        alignItems: 'center',
        shadowColor: colors.danger,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    clockBtnText: {
        color: 'white',
        fontSize: typography.sizes.h3,
        fontWeight: '900',
        letterSpacing: 1,
    },
    summaryCard: {
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: layout.borderRadius.card,
        marginTop: spacing.lg,
    },
    summaryTitle: {
        color: colors.text.primary,
        fontWeight: 'bold',
        marginBottom: spacing.md,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    statLabel: { color: colors.text.secondary },
    statValue: { color: colors.text.primary, fontWeight: 'bold' }
});
