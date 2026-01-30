import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../theme';

interface ScreenBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const ScreenBackground = ({ children, style }: ScreenBackgroundProps) => {
    return (
        <LinearGradient
            // Very subtle top-to-bottom fade: Pure White -> Slate 50
            colors={['#FFFFFF', '#F1F5F9']}
            style={[styles.container, style]}
        >
            {children}
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
});
