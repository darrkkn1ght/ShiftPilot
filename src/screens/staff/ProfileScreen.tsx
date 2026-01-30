import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { LogOut, User } from 'lucide-react-native';

export const ProfileScreen = () => {
    const { user, signOut } = useAuthStore();

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: signOut }
        ]);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner />
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                    </View>
                    <Text style={styles.email}>{user?.email}</Text>
                    <Text style={styles.role}>Staff Member</Text>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <LogOut color={colors.danger} size={20} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
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
    content: {
        padding: spacing.lg,
        alignItems: 'center',
        flex: 1,
    },
    profileCard: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.xl,
    },
    avatar: {
        width: 80, height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    email: {
        color: colors.text.primary,
        fontSize: typography.sizes.h3,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    role: {
        color: colors.text.secondary,
        textTransform: 'uppercase',
        fontSize: 12,
        letterSpacing: 1,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
        backgroundColor: colors.card,
        width: '100%',
        justifyContent: 'center',
    },
    logoutText: {
        color: colors.danger,
        fontWeight: 'bold',
    }
});
