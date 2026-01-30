import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, layout } from '../../theme';
import { ScreenBackground } from '../../components/ui/ScreenBackground';
import { useAuthStore } from '../../state/authStore';
import { businessRepo, shiftsRepo, timeEntriesRepo, requestsRepo } from '../../data/local/repos';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useFocusEffect } from '@react-navigation/native';
// @ts-ignore
import { Calendar, Users, Clock, AlertCircle, Plus, ChevronRight } from 'lucide-react-native';
import { FadeInView } from '../../components/ui/FadeInView';
import { BouncyBtn } from '../../components/ui/BouncyBtn';

export const DashboardScreen = ({ navigation }: any) => {
    const { user, signOut, activeBusinessId } = useAuthStore();
    const [stats, setStats] = useState({
        shiftsToday: 0,
        activeStaff: 0,
        lateStaff: 0,
        pendingRequests: 0,
    });
    const [businessName, setBusinessName] = useState('');

    const loadDashboardData = async () => {
        if (!activeBusinessId) return;

        // 1. Business Info
        const biz = businessRepo.getById(activeBusinessId);
        if (biz) setBusinessName(biz.name);

        const today = new Date().toISOString().split('T')[0];
        const shifts = shiftsRepo.getByDateRange(activeBusinessId, today, today);
        // published shifts only?
        const publishedShifts = shifts.filter(s => s.status === 'published');

        const active = timeEntriesRepo.getCurrentlyClockedIn(activeBusinessId);
        // Reuse search or getByDateRange logic from previous version
        const todaysEntries = timeEntriesRepo.getByDateRange(activeBusinessId, today, today);
        const lates = todaysEntries.filter(te => te.minutes_late > 0);

        const requests = requestsRepo.getPending(activeBusinessId);

        setStats({
            shiftsToday: publishedShifts.length,
            activeStaff: active.length,
            lateStaff: lates.length,
            pendingRequests: requests.length,
        });
    };

    useFocusEffect(
        useCallback(() => {
            loadDashboardData();
        }, [activeBusinessId])
    );

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.container} edges={['top']}>
                <OfflineBanner />
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header */}
                    <FadeInView delay={100} style={styles.header}>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.userName}>{businessName || user?.email?.split('@')[0]}</Text>
                        </View>
                        <BouncyBtn onPress={signOut} style={styles.profileBtn}>
                            <Users size={20} color={colors.primary} />
                        </BouncyBtn>
                    </FadeInView>

                    {/* Bento Grid */}
                    <View style={styles.bentoGrid}>
                        {/* Hero Card: Today's Overview */}
                        <FadeInView delay={200} style={styles.heroCard}>
                            <View style={styles.heroHeader}>
                                <Text style={styles.cardTitle}>Today's Operations</Text>
                                <Calendar size={20} color={colors.accent} />
                            </View>
                            <Text style={styles.heroValue}>{stats.shiftsToday}</Text>
                            <Text style={styles.heroLabel}>Shifts Scheduled</Text>
                        </FadeInView>

                        <View style={styles.row}>
                            {/* Stats Card: Active */}
                            <FadeInView delay={300} style={[styles.card, styles.halfCard]}>
                                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                    <Users size={22} color={colors.success} />
                                </View>
                                <Text style={styles.statValue}>{stats.activeStaff}</Text>
                                <Text style={styles.statLabel}>Active Now</Text>
                            </FadeInView>

                            {/* Stats Card: Late */}
                            <FadeInView delay={400} style={[styles.card, styles.halfCard]}>
                                <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
                                    <AlertCircle size={22} color={colors.warning} />
                                </View>
                                <Text style={styles.statValue}>{stats.lateStaff}</Text>
                                <Text style={styles.statLabel}>Late Arrivals</Text>
                            </FadeInView>
                        </View>

                        {/* Wide Card: Requests */}
                        <FadeInView delay={500} style={styles.card}>
                            <BouncyBtn style={styles.cardRow} onPress={() => navigation.navigate('Requests')}>
                                <View>
                                    <Text style={styles.cardTitle}>Requests</Text>
                                    <Text style={styles.cardSub}>{stats.pendingRequests} Pending Approval</Text>
                                </View>
                                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                                    <Clock size={22} color={colors.primary} />
                                </View>
                            </BouncyBtn>
                        </FadeInView>
                    </View>

                    {/* Actions */}
                    <FadeInView delay={600} style={styles.actions}>
                        <Text style={styles.sectionTitle}>Quick Actions</Text>

                        <BouncyBtn style={styles.actionBtn} onPress={() => navigation.navigate('Schedule')}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.primary }]}>
                                <Plus size={24} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionTitle}>Create Shift</Text>
                                <Text style={styles.actionSub}>Schedule for this week</Text>
                            </View>
                            <ChevronRight size={20} color={colors.text.muted} />
                        </BouncyBtn>

                        <BouncyBtn style={styles.actionBtn} onPress={() => navigation.navigate('Staff')}>
                            <View style={[styles.actionIcon, { backgroundColor: colors.text.secondary }]}>
                                <Users size={24} color="white" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.actionTitle}>Manage Staff</Text>
                                <Text style={styles.actionSub}>View directory & roles</Text>
                            </View>
                            <ChevronRight size={20} color={colors.text.muted} />
                        </BouncyBtn>
                    </FadeInView>

                </ScrollView>
            </SafeAreaView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    greeting: {
        fontSize: typography.sizes.body,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    userName: {
        fontSize: typography.sizes.h2,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
    },
    profileBtn: {
        padding: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.modal,
        borderWidth: 1,
        borderColor: colors.border,
    },

    // Bento Grid Layout
    bentoGrid: {
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    row: {
        flexDirection: 'row',
        gap: spacing.md,
    },

    // Cards
    card: {
        backgroundColor: colors.card,
        borderRadius: layout.borderRadius.card,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        // Shadow (Glass float)
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    heroCard: {
        backgroundColor: colors.card,
        borderRadius: layout.borderRadius.card, // Bigger radius for hero?
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#3B82F6', // Blue tinted shadow for hero
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    halfCard: {
        flex: 1,
    },

    // Text Styles
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    heroValue: {
        fontSize: 42, // Big!
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
        letterSpacing: -1,
    },
    heroLabel: {
        fontSize: typography.sizes.body,
        color: colors.text.secondary,
        marginTop: -4,
    },

    statValue: {
        fontSize: 28,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
        marginVertical: spacing.xs,
    },
    statLabel: {
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
    },

    cardTitle: {
        fontSize: typography.sizes.h3,
        fontWeight: typography.weights.medium,
        color: colors.text.primary,
        marginBottom: 4,
    },
    cardSub: {
        fontSize: typography.sizes.caption,
        color: colors.text.muted,
        marginTop: 2,
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    iconBox: {
        width: 42, height: 42,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Actions
    sectionTitle: {
        fontSize: typography.sizes.h3,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    actions: {
        gap: spacing.md,
    },
    actionBtn: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.card,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        // Clickable feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIcon: {
        width: 48, height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionTitle: {
        fontSize: typography.sizes.body,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
    },
    actionSub: {
        fontSize: typography.sizes.caption,
        color: colors.text.muted,
    },
});
