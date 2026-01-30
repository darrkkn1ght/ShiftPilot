import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { requestsRepo, staffRepo, shiftsRepo } from '../../data/local/repos';
import { Request, Staff } from '../../domain/types';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { Plus, Check, X } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export const RequestsScreen = () => {
    const { user, activeBusinessId } = useAuthStore();
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

    const [requests, setRequests] = useState<Request[]>([]);
    const [staffMap, setStaffMap] = useState<Record<string, Staff>>({});

    const [modalVisible, setModalVisible] = useState(false);
    const [newRequest, setNewRequest] = useState({ startDate: '', endDate: '', reason: '' });
    const [refreshing, setRefreshing] = useState(false);

    // Load Data
    const loadData = useCallback(() => {
        if (!user || !activeBusinessId) return;

        // 1. Identify Role & Staff
        const staff = staffRepo.getByUserAndBusiness(user.id, activeBusinessId);
        setCurrentStaff(staff);

        // Check role strictly from staff profile or membership. 
        // Usually authStore knows role but let's check staff record
        const admin = staff?.role === 'admin' || staff?.role === 'manager'; // Simple check
        setIsAdmin(admin);

        // 2. Load Requests
        if (admin) {
            // Load Pending only for Admin view
            const pending = requestsRepo.getPending(activeBusinessId);
            setRequests(pending);

            // Load staff names for these requests
            const sMap: Record<string, Staff> = {};
            pending.forEach(r => {
                if (!sMap[r.staff_id]) {
                    const s = staffRepo.getById(r.staff_id);
                    if (s) sMap[r.staff_id] = s;
                }
            });
            setStaffMap(sMap);
        } else {
            // Load My Requests
            if (staff) {
                const myRequests = requestsRepo.getByStaff(staff.id);
                setRequests(myRequests);
            }
        }
        setRefreshing(false);
    }, [user, activeBusinessId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleSubmit = () => {
        if (!currentStaff || !activeBusinessId) return;
        if (!newRequest.startDate || !newRequest.endDate) {
            Alert.alert('Required', 'Please enter dates.');
            return;
        }

        try {
            requestsRepo.create({
                business_id: activeBusinessId,
                staff_id: currentStaff.id,
                type: 'time_off',
                start_date: newRequest.startDate,
                end_date: newRequest.endDate,
                reason: newRequest.reason,
                status: 'pending',
            });
            setModalVisible(false);
            setNewRequest({ startDate: '', endDate: '', reason: '' });
            loadData();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const handleApprove = (req: Request) => {
        Alert.alert('Approve Request', 'This will flag affected shifts as needing coverage.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: () => {
                    requestsRepo.updateStatus(req.id, 'approved');
                    shiftsRepo.flagCoverage(activeBusinessId!, req.staff_id, req.start_date, req.end_date);
                    loadData();
                }
            }
        ]);
    };

    const handleDecline = (req: Request) => {
        requestsRepo.updateStatus(req.id, 'declined');
        loadData();
    };

    const renderItem = ({ item }: { item: Request }) => {
        // If admin and pending -> Show Action Cards
        // If staff -> Show Status Cards

        const s = staffMap[item.staff_id];
        const isMyRequest = item.staff_id === currentStaff?.id;

        // Admin View (Actionable)
        if (isAdmin && !isMyRequest && item.status === 'pending') {
            return (
                <View style={styles.card}>
                    <View style={styles.header}>
                        <Text style={styles.name}>{s?.name || 'Staff'}</Text>
                        <View style={styles.badgePending}><Text style={styles.badgeText}>PENDING</Text></View>
                    </View>
                    <Text style={styles.dates}>{item.start_date} -> {item.end_date}</Text>
                    {item.reason && <Text style={styles.reason}>"{item.reason}"</Text>}

                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.btnDecline} onPress={() => handleDecline(item)}>
                            <X color={colors.danger} size={20} />
                            <Text style={[styles.btnText, { color: colors.danger }]}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnApprove} onPress={() => handleApprove(item)}>
                            <Check color="white" size={20} />
                            <Text style={[styles.btnText, { color: 'white' }]}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        // Staff View (Read Only status)
        const statusColor = item.status === 'approved' ? colors.success : item.status === 'declined' ? colors.danger : colors.warning;
        return (
            <View style={[styles.card, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}>
                <View style={styles.header}>
                    <Text style={styles.dates}>{item.start_date} - {item.end_date}</Text>
                    <Text style={{ color: statusColor, fontWeight: 'bold', textTransform: 'uppercase', fontSize: 10 }}>{item.status}</Text>
                </View>
                <Text style={styles.reason}>{item.reason || 'Time Off'}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner />
            <View style={styles.topBar}>
                <Text style={styles.title}>{isAdmin ? 'Pending Requests' : 'My Requests'}</Text>
                {/* Staff or Admin can request time off for themselves */}
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={requests}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: spacing.md }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
                ListEmptyComponent={<Text style={styles.empty}>No requests found.</Text>}
            />

            {/* Create Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Request Time Off</Text>

                        <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.startDate}
                            onChangeText={t => setNewRequest({ ...newRequest, startDate: t })}
                            placeholder="2024-01-01" placeholderTextColor={colors.text.muted}
                        />

                        <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.endDate}
                            onChangeText={t => setNewRequest({ ...newRequest, endDate: t })}
                            placeholder="2024-01-05" placeholderTextColor={colors.text.muted}
                        />

                        <Text style={styles.label}>Reason</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.reason}
                            onChangeText={t => setNewRequest({ ...newRequest, reason: t })}
                            placeholder="Vacation, Sick, etc." placeholderTextColor={colors.text.muted}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: spacing.md }}><Text style={{ color: colors.text.secondary }}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}><Text style={{ color: 'white', fontWeight: 'bold' }}>Submit</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    topBar: {
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
    addBtn: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 4,
    },
    card: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.card,
        marginBottom: spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    name: {
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: typography.sizes.body,
    },
    badgePending: {
        backgroundColor: colors.warning + '20',
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    badgeText: {
        color: colors.warning,
        fontSize: 10,
        fontWeight: 'bold',
    },
    dates: {
        color: colors.text.primary,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    reason: {
        color: colors.text.secondary,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    btnApprove: {
        flex: 1,
        backgroundColor: colors.success,
        borderRadius: layout.borderRadius.button,
        padding: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
    },
    btnDecline: {
        flex: 1,
        borderColor: colors.danger,
        borderWidth: 1,
        borderRadius: layout.borderRadius.button,
        padding: spacing.sm,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
    },
    btnText: { fontWeight: 'bold' },
    empty: {
        color: colors.text.muted,
        textAlign: 'center',
        marginTop: spacing.xl,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.card,
        padding: spacing.lg,
    },
    modalTitle: {
        color: colors.text.primary,
        fontSize: typography.sizes.h2,
        fontWeight: 'bold',
        marginBottom: spacing.lg,
    },
    label: {
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.card,
        color: colors.text.primary,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
        marginBottom: spacing.md,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
        alignItems: 'center',
    },
    submitBtn: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: layout.borderRadius.button,
    }
});
