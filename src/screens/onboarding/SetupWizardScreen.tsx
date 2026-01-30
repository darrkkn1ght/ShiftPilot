import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuthStore } from '../../state/authStore';
import { businessRepo, membersRepo, staffRepo, shiftsRepo } from '../../data/local/repos';
import { colors, spacing, typography, layout } from '../../theme';

import { BusinessStep } from './steps/BusinessStep';
import { RulesStep } from './steps/RulesStep';
import { StaffStep } from './steps/StaffStep';
import { ScheduleStep } from './steps/ScheduleStep';

export const SetupWizardScreen = () => {
    const { user, loadProfile } = useAuthStore();
    const [step, setStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        timezone: 'UTC',
        lateThreshold: 10,
        staff: [] as any[],
        createSampleShift: true,
    });

    const steps = [
        { id: 'biz', title: 'Business', component: BusinessStep },
        { id: 'rules', title: 'Rules', component: RulesStep },
        { id: 'staff', title: 'Start Staff', component: StaffStep },
        { id: 'sched', title: 'Schedule', component: ScheduleStep },
    ];

    const CurrentComponent = steps[step].component;

    const handleNext = async () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            await finishSetup();
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const finishSetup = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            // 1. Create Business
            const business = businessRepo.create({
                name: formData.name,
                timezone: formData.timezone,
                late_threshold_minutes: formData.lateThreshold,
            });

            // 2. Add Owner as Admin Business Member
            membersRepo.create({
                user_id: user.id,
                business_id: business.id,
                role: 'admin',
            });

            // 3. Add Owner as Staff (so they appear in schedule)
            staffRepo.create({
                business_id: business.id,
                user_id: user.id,
                name: 'Me (Owner)',
                role: 'admin',
                hourly_rate: 0,
                active: true,
            });

            // 4. Add other staff
            formData.staff.forEach(s => {
                staffRepo.create({
                    business_id: business.id,
                    name: s.name,
                    role: s.role,
                    hourly_rate: s.hourly_rate,
                    active: true
                });
            });

            // 5. Create Sample Shift
            if (formData.createSampleShift) {
                // Find the owner staff id we just created
                // (In a real app we'd need the ID returned from step 3 more cleanly, 
                // but for now we query or just insert carefully. 
                // Actually staffRepo.create returns the object with ID.)

                // Let's re-fetch owner staff
                // Or better, capture it above.
                const ownerStaff = staffRepo.getByBusinessId(business.id).find(s => s.role === 'admin');

                if (ownerStaff) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    shiftsRepo.create({
                        business_id: business.id,
                        staff_id: ownerStaff.id,
                        date: tomorrow.toISOString().split('T')[0],
                        start_time: '09:00',
                        end_time: '17:00',
                        status: 'published',
                        notes: 'First shift!',
                    });
                }
            }

            // 6. Reload Profile to trigger navigation change
            await loadProfile(user.id);

        } catch (error: any) {
            Alert.alert('Setup Failed', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerText}>Step {step + 1} of {steps.length}</Text>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${((step + 1) / steps.length) * 100}%` }]} />
                </View>
            </View>

            {/* Content */}
            <View style={styles.content}>
                <CurrentComponent data={formData} setData={setFormData} />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handleBack} disabled={step === 0} style={{ opacity: step === 0 ? 0 : 1 }}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.nextButton} onPress={handleNext} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.nextText}>{step === steps.length - 1 ? 'Finish' : 'Next'}</Text>
                    )}
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
        padding: spacing.lg,
    },
    headerText: {
        color: colors.text.secondary,
        marginBottom: spacing.sm,
        fontSize: typography.sizes.caption,
    },
    progressTrack: {
        height: 4,
        backgroundColor: colors.surface,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    footer: {
        padding: spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backText: {
        color: colors.text.secondary,
        fontSize: typography.sizes.body,
    },
    nextButton: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: layout.borderRadius.button,
    },
    nextText: {
        color: 'white',
        fontWeight: typography.weights.bold,
        fontSize: typography.sizes.body,
    }
});
