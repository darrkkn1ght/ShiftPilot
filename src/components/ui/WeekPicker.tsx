import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, layout } from '../../theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface WeekPickerProps {
    startDate: Date;
    onPrev: () => void;
    onNext: () => void;
}

export const WeekPicker = ({ startDate, onPrev, onNext }: WeekPickerProps) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const formatDate = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={onPrev} style={styles.button}>
                <ChevronLeft size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <Text style={styles.text}>
                {formatDate(startDate)} - {formatDate(endDate)}
            </Text>

            <TouchableOpacity onPress={onNext} style={styles.button}>
                <ChevronRight size={20} color={colors.text.primary} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        padding: spacing.sm,
        borderRadius: layout.borderRadius.button,
        marginBottom: spacing.md,
    },
    button: {
        padding: spacing.xs,
    },
    text: {
        color: colors.text.primary,
        fontWeight: 'bold',
        fontSize: typography.sizes.body,
    },
});
