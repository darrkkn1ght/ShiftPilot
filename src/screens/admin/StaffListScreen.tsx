import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { staffRepo } from '../../data/local/repos';
import { Staff } from '../../domain/types';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { Plus, User, DollarSign, Shield } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '../../utils/formatting';

export const StaffListScreen = () => {
    const { activeBusinessId } = useAuthStore();
    const [staffList, setStaffList] = useState<Staff[]>([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ name: '', role: 'staff', hourlyRate: '', active: true });

    const loadData = useCallback(() => {
        if (!activeBusinessId) return;
        const data = staffRepo.getByBusinessId(activeBusinessId);
        setStaffList(data);
    }, [activeBusinessId]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleSave = () => {
        if (!activeBusinessId) return;
        if (!form.name) { Alert.alert('Error', 'Name required'); return; }

        try {
            staffRepo.create({
                business_id: activeBusinessId,
                name: form.name,
                role: form.role as any, // Simple cast for MVP
                hourly_rate: parseFloat(form.hourlyRate) || 0,
                active: form.active
            });
            setModalVisible(false);
            setForm({ name: '', role: 'staff', hourlyRate: '', active: true });
            loadData();
        } catch (e: any) {
            Alert.alert('Error', e.message);
        }
    };

    const renderItem = ({ item }: { item: Staff }) => (
        <View style={[styles.card, !item.active && { opacity: 0.6 }]}>
            <View style={styles.row}>
                <View style={styles.iconBox}>
                    <User color={colors.text.primary} size={20} />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.badges}>
                        <View style={styles.badge}>
                            <Shield size={10} color={colors.text.secondary} />
                            <Text style={styles.badgeText}>{item.role}</Text>
                        </View>
                        <View style={styles.badge}>
                            <DollarSign size={10} color={colors.text.secondary} />
                            <Text style={styles.badgeText}>{formatCurrency(item.hourly_rate)}/hr</Text>
                        </View>
                        {!item.active && (
                            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                                <Text style={[styles.badgeText, { color: 'white' }]}>Inactive</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner />
            <View style={styles.header}>
                <Text style={styles.title}>Team ({staffList.length})</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
                    <Plus color="white" size={24} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={staffList}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No team members yet.</Text>}
            />

            {/* Add Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.modal}>
                        <Text style={styles.modalTitle}>Add Team Member</Text>

                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={t => setForm({ ...form, name: t })}
                            placeholder="John Doe"
                            placeholderTextColor={colors.text.muted}
                        />

                        <Text style={styles.label}>Rate ($/hr)</Text>
                        <TextInput
                            style={styles.input}
                            value={form.hourlyRate}
                            onChangeText={t => setForm({ ...form, hourlyRate: t })}
                            keyboardType="numeric"
                            placeholder="15.00"
                            placeholderTextColor={colors.text.muted}
                        />

                        <View style={styles.switchRow}>
                            <Text style={styles.label}>Role: Admin?</Text>
                            <Switch
                                value={form.role === 'admin'}
                                onValueChange={v => setForm({ ...form, role: v ? 'admin' : 'staff' })}
                            />
                        </View>

                        <View style={styles.actions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveText}>Add Member</Text>
                            </TouchableOpacity>
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
    addBtn: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        padding: 4,
    },
    list: { padding: spacing.md },
    card: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.card,
        marginBottom: spacing.md,
    },
    row: { flexDirection: 'row', gap: spacing.md },
    iconBox: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: colors.surface,
        justifyContent: 'center', alignItems: 'center',
    },
    info: { flex: 1 },
    name: {
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: typography.sizes.body,
        marginBottom: 4,
    },
    badges: { flexDirection: 'row', gap: spacing.sm },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surface,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        color: colors.text.secondary,
        fontSize: 10,
        textTransform: 'capitalize',
    },
    empty: { color: colors.text.muted, textAlign: 'center', marginTop: 20 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: spacing.lg,
    },
    modal: {
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
    label: { color: colors.text.secondary, marginBottom: 4 },
    input: {
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    actions: { flexDirection: 'row', gap: spacing.md },
    cancelBtn: { flex: 1, padding: spacing.md, alignItems: 'center' },
    cancelText: { color: colors.text.secondary },
    saveBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
        alignItems: 'center',
    },
    saveText: { color: 'white', fontWeight: 'bold' },
});
