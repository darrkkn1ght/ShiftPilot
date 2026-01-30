import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { timeEntriesRepo, staffRepo } from '../../data/local/repos';
import { TimeEntry, Staff } from '../../domain/types';
import { formatDuration } from '../../domain/attendance';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useFocusEffect } from '@react-navigation/native';

export const AttendanceLogScreen = () => {
    const { activeBusinessId } = useAuthStore();
    const [logs, setLogs] = useState<TimeEntry[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, Staff>>({});
    const [filterLate, setFilterLate] = useState(false);

    const loadData = useCallback(() => {
        if (!activeBusinessId) return;

        // 1. Load Staff Map
        const staff = staffRepo.getByBusinessId(activeBusinessId);
        const map: Record<string, Staff> = {};
        staff.forEach(s => map[s.id] = s);
        setStaffMap(map);

        // 2. Load Logs
        const data = timeEntriesRepo.search(activeBusinessId, { isLate: filterLate });
        setLogs(data);
    }, [activeBusinessId, filterLate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const renderItem = ({ item }: { item: TimeEntry }) => {
        const staff = staffMap[item.staff_id];
        const date = new Date(item.clock_in);
        const isLate = item.minutes_late > 0;

        return (
            <View style={styles.card}>
                <View style={styles.row}>
                    <Text style={styles.name}>{staff?.name || 'Unknown'}</Text>
                    <Text style={styles.date}>{date.toLocaleDateString()}</Text>
                </View>
                <View style={[styles.row, { marginTop: spacing.xs }]}>
                    <Text style={styles.time}>
                        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {item.clock_out ? ` - ${new Date(item.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Active)'}
                    </Text>
                    {isLate && (
                        <View style={styles.lateBadge}>
                            <Text style={styles.lateText}>{item.minutes_late}m Late</Text>
                        </View>
                    )}
                </View>
                {item.clock_out && (
                    <Text style={styles.duration}>Worked: {formatDuration(item.total_minutes)}</Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <OfflineBanner />
            <View style={styles.header}>
                <Text style={styles.title}>Attendance Log</Text>
                <TouchableOpacity
                    style={[styles.filterBtn, filterLate && styles.filterBtnActive]}
                    onPress={() => setFilterLate(!filterLate)}
                >
                    <Text style={[styles.filterText, filterLate && styles.filterTextActive]}>Late Only</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={logs}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: spacing.md }}
                ListEmptyComponent={<Text style={styles.empty}>No records found.</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        padding: spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.card,
    },
    title: {
        fontSize: typography.sizes.h2,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    card: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.card,
        marginBottom: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: typography.sizes.body,
    },
    date: { color: colors.text.muted, fontSize: typography.sizes.caption },
    time: { color: colors.text.secondary },
    lateBadge: {
        backgroundColor: colors.warning + '20', // Opacity
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: 4,
    },
    lateText: { color: colors.warning, fontSize: 10, fontWeight: 'bold' },
    duration: {
        color: colors.success,
        fontSize: 12,
        fontWeight: '600',
        marginTop: spacing.xs,
    },
    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.text.muted,
    },
    filterBtnActive: {
        backgroundColor: colors.warning,
        borderColor: colors.warning,
    },
    filterText: { color: colors.text.muted, fontSize: 12 },
    filterTextActive: { color: 'black', fontWeight: 'bold' },
    empty: {
        color: colors.text.muted,
        textAlign: 'center',
        marginTop: spacing.xl,
    }
});
