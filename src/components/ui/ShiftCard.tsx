import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, layout } from '../../theme';
import { Shift, Staff } from '../../domain/types';
import { Clock, User } from 'lucide-react-native';

interface ShiftCardProps {
    shift: Shift;
    staff?: Staff;
    onPress: () => void;
}

const getStatusColor = (status: Shift['status']) => {
    switch (status) {
        case 'published': return colors.primary;
        case 'draft': return colors.text.muted;
        case 'canceled': return colors.danger;
        default: return colors.text.muted;
    }
};

export const ShiftCard = ({ shift, staff, onPress }: ShiftCardProps) => {
    const statusColor = getStatusColor(shift.status);

    return (
        <TouchableOpacity style={[styles.card, { borderLeftColor: statusColor }]} onPress={onPress}>
            <View style={styles.header}>
                <View style={styles.timeRow}>
                    <Clock size={14} color={colors.text.secondary} />
                    <Text style={styles.timeText}>
                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                    </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{shift.status}</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.staffRow}>
                    <User size={16} color={colors.text.primary} />
                    <Text style={styles.staffName}>{staff?.name || 'Unassigned'}</Text>
                </View>
                {staff?.role && <Text style={styles.roleText}>{staff.role}</Text>}
            </View>

            {shift.notes && (
                <Text style={styles.notes} numberOfLines={1}>{shift.notes}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: layout.borderRadius.card,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderLeftWidth: 4,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    timeText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: typography.sizes.body,
    },
    badge: {
        paddingHorizontal: spacing.xs + 2,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    content: {
        marginBottom: spacing.xs,
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    staffName: {
        color: colors.text.primary,
        fontSize: typography.sizes.body,
        fontWeight: '500',
    },
    roleText: {
        color: colors.text.secondary,
        fontSize: typography.sizes.caption,
        marginLeft: 20, // Align with name
    },
    notes: {
        color: colors.text.muted,
        fontSize: typography.sizes.caption,
        fontStyle: 'italic',
        marginTop: spacing.xs,
    }
});
