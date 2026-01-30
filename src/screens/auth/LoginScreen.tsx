import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, StyleSheet } from 'react-native';
import { useAuthStore } from '../../state/authStore';
import { colors, spacing, typography, layout } from '../../theme';
import { ScreenBackground } from '../../components/ui/ScreenBackground';

export const LoginScreen = ({ navigation }: any) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { signIn, isLoading } = useAuthStore();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }
        setIsSubmitting(true);
        const { error } = await signIn(email, password);
        setIsSubmitting(false);

        if (error) {
            Alert.alert('Login Failed', error.message);
        }
    };

    return (
        <ScreenBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.content}>
                    <Text style={styles.title}>ShiftPilot</Text>
                    <Text style={styles.subtitle}>Operational Calm</Text>

                    <View style={styles.form}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="yours@business.com"
                            placeholderTextColor={colors.text.muted}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="********"
                            placeholderTextColor={colors.text.muted}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            autoCapitalize="none"
                        />

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleLogin}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.buttonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('SignUp')} style={styles.linkButton}>
                            <Text style={styles.linkText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </ScreenBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor: colors.background, // handled by ScreenBackground
    },
    content: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'center',
    },
    title: {
        fontSize: typography.sizes.h1,
        fontWeight: typography.weights.bold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.sizes.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl * 2,
    },
    form: {
        gap: spacing.md,
    },
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
        borderColor: colors.border,
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.md,
        borderRadius: layout.borderRadius.button,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    buttonText: {
        color: 'white',
        fontWeight: typography.weights.bold,
        fontSize: typography.sizes.body,
    },
    linkButton: {
        alignItems: 'center',
        marginTop: spacing.md,
    },
    linkText: {
        color: colors.primary,
    },
});
