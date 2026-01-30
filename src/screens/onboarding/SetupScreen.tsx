import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuthStore } from '../../state/authStore';
import { colors } from '../../theme';
import { ScreenBackground } from '../../components/ui/ScreenBackground';

export const SetupScreen = () => {
    const { signOut } = useAuthStore();

    return (
        <ScreenBackground>
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: 'white', fontSize: 20, marginBottom: 20 }}>Business Setup Wizard</Text>
                <Text style={{ color: 'gray', marginBottom: 20 }}>User has no business yet.</Text>

                <TouchableOpacity onPress={signOut} style={{ padding: 10, backgroundColor: colors.card, borderRadius: 8 }}>
                    <Text style={{ color: 'white' }}>Sign Out</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </ScreenBackground>
    );
};
