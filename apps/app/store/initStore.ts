import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EmailTemplateData, WhatsAppTemplateData } from '@repo/data-services';
import { subDays, differenceInMilliseconds } from 'date-fns';

interface DateRange {
    from: Date;
    to: Date;
    preset?: string;
}

interface AnalyticsDateFilter {
    current: DateRange;
    previous?: DateRange;
    compareEnabled: boolean;
}

interface EmailTemplateState {
    templates: EmailTemplateData[];
    selectedTemplate: { subject: string; content: string } | null;
    customSubject: string;
    customContent: string;
    selectedTemplateId: string;
}

interface WhatsAppTemplateState {
    templates: WhatsAppTemplateData[];
    selectedContent: string;
    selectedTemplateId: string;
}

interface InitStore {
    isInitialized: boolean;
    setIsInitialized: (isInitialized: boolean) => void;
    // Analytics tab persistence
    analyticsActiveTab: string;
    setAnalyticsActiveTab: (tab: string) => void;
    // Analytics date filter
    analyticsDateFilter: AnalyticsDateFilter;
    setAnalyticsDateFilter: (filter: AnalyticsDateFilter) => void;
    resetAnalyticsDateFilter: () => void;

    // Email templates
    emailTemplates: EmailTemplateState;
    setEmailTemplates: (templates: EmailTemplateData[]) => void;
    setEmailTemplateSelection: (templateId: string, template?: EmailTemplateData) => void;
    setEmailCustomContent: (subject: string, content: string) => void;
    resetEmailTemplateState: () => void;

    // WhatsApp templates
    whatsappTemplates: WhatsAppTemplateState;
    setWhatsAppTemplates: (templates: WhatsAppTemplateData[]) => void;
    setWhatsAppTemplateSelection: (templateId: string, template?: WhatsAppTemplateData) => void;
    setWhatsAppCustomContent: (content: string) => void;
    resetWhatsAppTemplateState: () => void;
}

// Helper function to get default date range (last 30 days)
const getDefaultDateRange = (): DateRange => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 29);

    return {
        from: thirtyDaysAgo,
        to: today,
        preset: 'last-30-days'
    };
};

// Helper function to get previous period for comparison
const getPreviousPeriod = (current: DateRange): DateRange => {
    const duration = differenceInMilliseconds(current.to, current.from);
    const previousEnd = new Date(current.from.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);

    return {
        from: previousStart,
        to: previousEnd
    };
};

const getDefaultAnalyticsDateFilter = (): AnalyticsDateFilter => {
    const defaultRange = getDefaultDateRange();
    return {
        current: defaultRange,
        compareEnabled: false,
        previous: undefined
    };
};

const getDefaultEmailTemplateState = (): EmailTemplateState => ({
    templates: [],
    selectedTemplate: null,
    customSubject: '',
    customContent: '',
    selectedTemplateId: ''
});

const getDefaultWhatsAppTemplateState = (): WhatsAppTemplateState => ({
    templates: [],
    selectedContent: '',
    selectedTemplateId: ''
});

export const useInitStore = create<InitStore>()(
    persist(
        (set, get) => ({
            isInitialized: false,
            setIsInitialized: (isInitialized: boolean) => set({ isInitialized }),
            // Analytics tab persistence
            analyticsActiveTab: 'daily',
            setAnalyticsActiveTab: (tab: string) => set({ analyticsActiveTab: tab }),
            // Analytics date filter
            analyticsDateFilter: getDefaultAnalyticsDateFilter(),
            setAnalyticsDateFilter: (filter: AnalyticsDateFilter) => {
                // Auto-calculate previous period if compare is enabled
                const updatedFilter = {
                    ...filter,
                    previous: filter.compareEnabled ? getPreviousPeriod(filter.current) : undefined
                };
                set({ analyticsDateFilter: updatedFilter });
            },
            resetAnalyticsDateFilter: () => set({ analyticsDateFilter: getDefaultAnalyticsDateFilter() }),

            // Email templates
            emailTemplates: getDefaultEmailTemplateState(),
            setEmailTemplates: (templates: EmailTemplateData[]) =>
                set((state) => ({
                    emailTemplates: { ...state.emailTemplates, templates }
                })),
            setEmailTemplateSelection: (templateId: string, template?: EmailTemplateData) =>
                set((state) => {
                    if (templateId === 'custom') {
                        return {
                            emailTemplates: {
                                ...state.emailTemplates,
                                selectedTemplateId: templateId,
                                selectedTemplate: null,
                                customSubject: '',
                                customContent: ''
                            }
                        };
                    }

                    if (template) {
                        return {
                            emailTemplates: {
                                ...state.emailTemplates,
                                selectedTemplateId: templateId,
                                selectedTemplate: { subject: template.subject, content: template.content },
                                customSubject: template.subject,
                                customContent: template.content
                            }
                        };
                    }

                    return {
                        emailTemplates: {
                            ...state.emailTemplates,
                            selectedTemplateId: templateId
                        }
                    };
                }),
            setEmailCustomContent: (subject: string, content: string) =>
                set((state) => ({
                    emailTemplates: {
                        ...state.emailTemplates,
                        customSubject: subject,
                        customContent: content,
                        selectedTemplate: { subject, content }
                    }
                })),
            resetEmailTemplateState: () =>
                set({ emailTemplates: getDefaultEmailTemplateState() }),

            // WhatsApp templates
            whatsappTemplates: getDefaultWhatsAppTemplateState(),
            setWhatsAppTemplates: (templates: WhatsAppTemplateData[]) =>
                set((state) => ({
                    whatsappTemplates: { ...state.whatsappTemplates, templates }
                })),
            setWhatsAppTemplateSelection: (templateId: string, template?: WhatsAppTemplateData) =>
                set((state) => {
                    if (templateId === 'custom') {
                        return {
                            whatsappTemplates: {
                                ...state.whatsappTemplates,
                                selectedTemplateId: templateId,
                                selectedContent: ''
                            }
                        };
                    }

                    if (template) {
                        return {
                            whatsappTemplates: {
                                ...state.whatsappTemplates,
                                selectedTemplateId: templateId,
                                selectedContent: template.content
                            }
                        };
                    }

                    return {
                        whatsappTemplates: {
                            ...state.whatsappTemplates,
                            selectedTemplateId: templateId
                        }
                    };
                }),
            setWhatsAppCustomContent: (content: string) =>
                set((state) => ({
                    whatsappTemplates: {
                        ...state.whatsappTemplates,
                        selectedContent: content
                    }
                })),
            resetWhatsAppTemplateState: () =>
                set({ whatsappTemplates: getDefaultWhatsAppTemplateState() }),
        }),
        {
            name: 'init-store',
            storage: createJSONStorage(() => localStorage),
        }
    )
);

// Export types for use in components
export type { DateRange, AnalyticsDateFilter };
