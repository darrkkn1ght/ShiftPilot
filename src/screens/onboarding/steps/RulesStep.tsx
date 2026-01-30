import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography, layout } from '../../../theme';

export const RulesStep = ({ data, setData }: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Set your rules</Text>
            <Text style={styles.subtitle}>When do you consider a shift "late"?</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Late Threshold (Minutes)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="10"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="number-pad"
                    value={data.lateThreshold.toString()}
                    onChangeText={(t) => setData({ ...data, lateThreshold: parseInt(t) || 0 })}
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
    form: { gap: spacing.md },
    label: {
        color: colors.text.secondary,
        fontSize: typography.sizes.caption,
        marginLeft: spacing.xs,
    },
    input: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.button,
        padding: spacing.md,
        color: colors.text.primary,
        fontSize: typography.sizes.body,
        borderWidth: 1,
        borderColor: colors.card,
    },
});
