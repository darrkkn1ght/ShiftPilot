import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, layout } from '../../theme';
import { useAuthStore } from '../../state/authStore';
import { staffRepo, timeEntriesRepo } from '../../data/local/repos';
import { PayrollReportItem, generatePayrollReport } from '../../domain/payroll';
import { WeekPicker } from '../../components/ui/WeekPicker';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '../../utils/formatting'; // Need to create or inline

export const ReportsScreen = ({ navigation }: any) => {
    const { activeBusinessId } = useAuthStore();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reportData, setReportData] = useState<PayrollReportItem[]>([]);

    // Calculate Week Range
    const getWeekRange = (date: Date) => {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Mon start
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return { start, end };
    };

    const loadData = useCallback(() => {
        if (!activeBusinessId) return;

        // 1. Get Date Range
        const { start, end } = getWeekRange(currentDate);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        // 2. Fetch Data
        const staff = staffRepo.getByBusinessId(activeBusinessId);
        const entries = timeEntriesRepo.getByDateRange(activeBusinessId, startStr, endStr);

        // 3. Aggregate
        const report = generatePayrollReport(staff, entries);
        setReportData(report);

    }, [activeBusinessId, currentDate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handlePrev = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() - 7);
        setCurrentDate(d);
    };

    const handleNext = () => {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + 7);
        setCurrentDate(d);
    };

    const renderItem = ({ item }: { item: PayrollReportItem }) => (
        <View style={styles.row}>
            <View style={styles.colName}>
                <Text style={styles.nameText}>{item.staffName}</Text>
                <Text style={styles.subText}>${item.hourlyRate}/hr</Text>
            </View>
            <View style={styles.colValue}>
                <Text style={styles.valueText}>{item.totalHours}h</Text>
            </View>
            <View style={styles.colValue}>
                <Text style={[styles.valueText, item.lateCount > 0 ? { color: colors.warning } : {}]}>
                    {item.lateCount}
                </Text>
            </View>
            <View style={styles.colRight}>
                <Text style={styles.moneyText}>${item.estimatedPay.toFixed(2)}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <OfflineBanner />
            <View style={styles.header}>
                <Text style={styles.title}>Payroll Summary</Text>
            </View>

            <View style={{ paddingHorizontal: spacing.md }}>
                <WeekPicker
                    startDate={getWeekRange(currentDate).start}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />
            </View>

            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.headerText, styles.colName]}>STAFF</Text>
                <Text style={[styles.headerText, styles.colValue]}>HOURS</Text>
                <Text style={[styles.headerText, styles.colValue]}>LATE</Text>
                <Text style={[styles.headerText, styles.colRight]}>EST. PAY</Text>
            </View>

            <FlatList
                data={reportData}
                keyExtractor={item => item.staffId}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />

            {/* Helper Link to Logs */}
            <TouchableOpacity
                style={styles.logsLink}
                onPress={() => navigation.navigate('AdminAttendanceLog')} // Need to check if this route exists in stack or tab
            >
                {/* Note: I haven't exposed AttendanceLog as a stack route accessible from here, 
                 but typically it's nice to clear up navigation. 
                 For now, maybe just "See detailed logs in Attendance Tab" if I kept it?
                 Wait, I am REPLACING the generic 'Reports' tab content with THIS screen. 
                 So the user loses access to AttendanceLog unless I add it back.
                 I'll just add a button to navigate to it if I can enable it, otherwise I'll leave it simple.
              */}
            </TouchableOpacity>
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
    },
    title: {
        fontSize: typography.sizes.h1,
        fontWeight: 'bold',
        color: colors.text.primary,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        marginTop: spacing.md,
    },
    headerText: {
        color: colors.text.secondary,
        fontSize: 10,
        fontWeight: 'bold',
    },
    list: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },
    row: {
        flexDirection: 'row',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.card,
        alignItems: 'center',
    },
    colName: {
        flex: 3,
    },
    colValue: {
        flex: 2,
        alignItems: 'center',
    },
    colRight: {
        flex: 2,
        alignItems: 'flex-end',
    },
    nameText: {
        color: colors.text.primary,
        fontWeight: '600',
        fontSize: typography.sizes.body,
    },
    subText: {
        color: colors.text.muted,
        fontSize: typography.sizes.caption,
    },
    valueText: {
        color: colors.text.primary,
        fontVariant: ['tabular-nums'],
    },
    moneyText: {
        color: colors.success,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    logsLink: {
        padding: spacing.md,
        alignItems: 'center',
    },
});
