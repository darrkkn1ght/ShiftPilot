import { Platform, TextStyle } from 'react-native';

export const typography = {
    fonts: {
        // In a full implementation, we would load Sora and Inter.
        // Using system sans-serif as robust fallback.
        heading: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
        body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
        mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    },
    sizes: {
        h1: 28,
        h2: 22,
        h3: 18,
        body: 15,
        caption: 13,
    },
    weights: {
        regular: '400' as TextStyle['fontWeight'],
        medium: '500' as TextStyle['fontWeight'],
        bold: '700' as TextStyle['fontWeight'],
    },
};
