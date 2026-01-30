import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { colors, spacing, typography } from '../../theme';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner = () => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });
        return () => unsubscribe();
    }, []);

    if (isConnected) return null;

    return (
        <View style={styles.container}>
            <WifiOff size={16} color="white" />
            <Text style={styles.text}>Offline Mode</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.warning, // Or a distinct color like dark orange
        padding: spacing.xs,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
    },
    text: {
        color: 'white',
        fontSize: typography.sizes.caption,
        fontWeight: 'bold',
    },
});
