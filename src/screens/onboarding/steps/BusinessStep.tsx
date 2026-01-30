import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, spacing, typography, layout } from '../../../theme';

export const BusinessStep = ({ data, setData }: any) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Tell us about your business</Text>
            <Text style={styles.subtitle}>This will be the name your team sees.</Text>

            <View style={styles.form}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. Downtown Salon"
                    placeholderTextColor={colors.text.muted}
                    value={data.name}
                    onChangeText={(t) => setData({ ...data, name: t })}
                />

                <Text style={styles.label}>Timezone (UTC Offset)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. -05:00"
                    placeholderTextColor={colors.text.muted}
                    value={data.timezone}
                    onChangeText={(t) => setData({ ...data, timezone: t })}
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
