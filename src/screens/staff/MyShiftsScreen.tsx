import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { shiftsRepo, staffRepo } from '../../data/local/repos';
import { Shift, Staff } from '../../domain/types';
import { ShiftCard } from '../../components/ui/ShiftCard';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useFocusEffect } from '@react-navigation/native';

export const MyShiftsScreen = ({ navigation }: any) => {
    const { user, activeBusinessId } = useAuthStore();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = useCallback(() => {
        if (!user || !activeBusinessId) return;

        // 1. Get My Staff Profile
        const staff = staffRepo.getByUserAndBusiness(user.id, activeBusinessId);
        setCurrentStaff(staff);

        if (staff) {
            // 2. Get My Shifts (Next 30 days for example)
            const today = new Date();
            const startStr = today.toISOString().split('T')[0];
            const end = new Date();
            end.setDate(end.getDate() + 30);
            const endStr = end.toISOString().split('T')[0];

            // This repo method gets ALL shifts for business in range. 
            // We filter for MY staff_id.
            // Ideally repo has getByStaffAndDateRange but this works for MVP.
            const allShifts = shiftsRepo.getByDateRange(activeBusinessId, startStr, endStr);
            const myShifts = allShifts.filter(s => s.staff_id === staff.id && s.status === 'published');

            setShifts(myShifts);
        }
        setRefreshing(false);
    }, [user, activeBusinessId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner />
            <View style={styles.header}>
                <Text style={styles.title}>My Shifts</Text>
            </View>

            <FlatList
                data={shifts}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: spacing.md }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
                renderItem={({ item, index }) => {
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
                                // No need to pass staff, it's me
                                onPress={() => { }} // Read only for staff
                            />
                        </View>
                    );
                }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No upcoming shifts.</Text>
                    </View>
                }
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
        borderBottomWidth: 1,
        borderBottomColor: colors.card,
    },
    title: {
        fontSize: typography.sizes.h1,
        fontWeight: 'bold',
        color: colors.text.primary,
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
