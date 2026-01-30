import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { colors, spacing, typography, layout } from '../../../theme';

export const ScheduleStep = ({ data, setData }: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Quick Start Schedule</Text>
            <Text style={styles.subtitle}>We can auto-create a sample shift for you.</Text>

            <View style={styles.row}>
                <Text style={styles.label}>Create a sample "9-5" shift for tomorrow?</Text>
                <Switch
                    value={data.createSampleShift}
                    onValueChange={(val) => setData({ ...data, createSampleShift: val })}
                    trackColor={{ false: colors.surface, true: colors.primary }}
                    thumbColor={'white'}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: spacing.md },
    title: {
        fontSize: typography.sizes.h2,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
    },
    subtitle: {
        fontSize: typography.sizes.body,
        color: colors.text.secondary,
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
    },
    label: {
        color: colors.text.primary,
        flex: 1,
    }
});
