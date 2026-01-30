import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { shiftsRepo, staffRepo } from '../../data/local/repos';
import { Shift, Staff } from '../../domain/types';
import { ShiftCard } from '../../components/ui/ShiftCard';
import { WeekPicker } from '../../components/ui/WeekPicker';
import { EditShiftModal } from './EditShiftModal';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { Plus } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export const ScheduleScreen = () => {
    const { activeBusinessId } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Data
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, Staff>>({});

    // UI State
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Calculate Week Range
    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Mon start
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const loadData = useCallback(() => {
        if (!activeBusinessId) return;

        // 1. Load Staff Map
        const staff = staffRepo.getByBusinessId(activeBusinessId);
        const map: Record<string, Staff> = {};
        staff.forEach(s => map[s.id] = s);
        setStaffMap(map);

        // 2. Load Shifts
        const { start, end } = getWeekRange(currentDate);
        // Format YYYY-MM-DD
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const data = shiftsRepo.getByDateRange(activeBusinessId, startStr, endStr);
        setShifts(data);
        setRefreshing(false);
    }, [activeBusinessId, currentDate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleEdit = (shift: Shift) => {
        setSelectedShift(shift);
        setModalVisible(true);
    };

    const handleCreate = () => {
        setSelectedShift(null);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        loadData();
    };

    // Group by Date for SectionList-like feel or just flat list with headers?
    // Flat list sorted by date is easiest for MVP.

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner />
            <View style={styles.header}>
                <Text style={styles.title}>Schedule</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: spacing.md }}>
                <WeekPicker
                    startDate={getWeekRange(currentDate).start}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />
            </View>

            <FlatList
                data={shifts}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: spacing.md }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
                renderItem={({ item, index }) => {
                    // Check if date header needed
                    const prev = shifts[index - 1];
                    const showHeader = !prev || prev.date !== item.date;

                    return (
                        <View>
                            {showHeader && (
                                <Text style={styles.dateHeader}>
                                    {new Date(item.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                </Text>
                            )}
                            <ShiftCard
                                shift={item}
                                staff={staffMap[item.staff_id]}
                                onPress={() => handleEdit(item)}
                            />
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No shifts this week.</Text>
                        <TouchableOpacity onPress={handleCreate}>
                            <Text style={{ color: colors.primary, marginTop: spacing.sm }}>+ Add Shift</Text>
                        </TouchableOpacity>
                    </View>
                }
            />

            <EditShiftModal
                visible={modalVisible}
                onClose={handleModalClose}
                shift={selectedShift}
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
    },
    title: {
        fontSize: typography.sizes.h1,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    addButton: {
        backgroundColor: colors.primary,
        padding: spacing.xs,
        borderRadius: 8,
    },
    dateHeader: {
        color: colors.text.secondary,
        fontWeight: 'bold',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        fontSize: 12,
    },
    empty: {
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        color: colors.text.muted,
    }
});
