import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { colors, spacing, typography, layout } from '../../../theme';
import { Plus, Trash2 } from 'lucide-react-native';

export const StaffStep = ({ data, setData }: any) => {
    const [newName, setNewName] = useState('');
    const [newRate, setNewRate] = useState('');

    const addStaff = () => {
        if (!newName) return;
        const staff = {
            id: Date.now().toString(), // Temp ID for UI
            name: newName,
            role: 'staff',
            hourly_rate: parseFloat(newRate) || 0,
        };
        setData({ ...data, staff: [...data.staff, staff] });
        setNewName('');
        setNewRate('');
    };

    const removeStaff = (id: string) => {
        setData({ ...data, staff: data.staff.filter((s: any) => s.id !== id) });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add your team</Text>
            <Text style={styles.subtitle}>You can add more later.</Text>

            {/* Input Row */}
            <View style={styles.row}>
                <View style={{ flex: 2 }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor={colors.text.muted}
                        value={newName}
                        onChangeText={setNewName}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <TextInput
                        style={styles.input}
                        placeholder="Rate/hr"
                        placeholderTextColor={colors.text.muted}
                        keyboardType="numeric"
                        value={newRate}
                        onChangeText={setNewRate}
                    />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={addStaff}>
                    <Plus color="white" size={20} />
                </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
                data={data.staff}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.staffItem}>
                        <View>
                            <Text style={styles.staffName}>{item.name}</Text>
                            <Text style={styles.staffRole}>{item.role} • ${item.hourly_rate}/hr</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeStaff(item.id)}>
                            <Trash2 color={colors.danger} size={18} />
                        </TouchableOpacity>
                    </View>
                )}
                style={{ maxHeight: 300, marginTop: spacing.md }}
            />
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
    row: { flexDirection: 'row', gap: spacing.sm },
    input: {
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius.button,
        padding: spacing.md,
        color: colors.text.primary,
        fontSize: typography.sizes.body,
        borderWidth: 1,
        borderColor: colors.card,
    },
    addButton: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: layout.borderRadius.button,
        width: 50,
    },
    staffItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
        marginBottom: spacing.sm,
    },
    staffName: {
        color: colors.text.primary,
        fontWeight: 'bold',
    },
    staffRole: {
        color: colors.text.secondary,
        fontSize: typography.sizes.caption,
    }
});
