'use client';

import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Card, CardContent } from '@repo/design-system/components/ui/card';
import { useInitStore } from '../../../../../../store/initStore';

// Server components imports (mantenemos como props)
interface AnalyticsTabsWrapperProps {
    dailyTab: React.ReactNode;
    monthlyTab: React.ReactNode;
    productsTab: React.ReactNode;
    categoriesTab: React.ReactNode;
    paymentsTab: React.ReactNode;
    frequencyTab: React.ReactNode;
    quantityTab: React.ReactNode;
}

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="space-y-4">
                <div className="overflow-x-auto">
                    <div className="h-10 w-full min-w-[480px] md:min-w-0 bg-gray-200 rounded animate-pulse" />
                </div>
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-16 w-full bg-gray-200 rounded animate-pulse" />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export function AnalyticsTabsWrapper({
    dailyTab,
    monthlyTab,
    productsTab,
    categoriesTab,
    paymentsTab,
    frequencyTab,
    quantityTab
}: AnalyticsTabsWrapperProps) {
    const { analyticsActiveTab, setAnalyticsActiveTab } = useInitStore();

    return (
        <Tabs value={analyticsActiveTab} onValueChange={setAnalyticsActiveTab} className="space-y-4">
            <div className="overflow-x-auto">
                <TabsList className="grid grid-cols-7 w-full min-w-[560px] md:min-w-0">
                    <TabsTrigger value="daily" className="text-xs md:text-sm px-1 md:px-3">Por Día</TabsTrigger>
                    <TabsTrigger value="monthly" className="text-xs md:text-sm px-1 md:px-3">Por Mes</TabsTrigger>
                    <TabsTrigger value="products" className="text-xs md:text-sm px-1 md:px-3">Productos</TabsTrigger>
                    <TabsTrigger value="categories" className="text-xs md:text-sm px-1 md:px-3">Categorías</TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs md:text-sm px-1 md:px-3">Pagos</TabsTrigger>
                    <TabsTrigger value="frequency" className="text-xs md:text-sm px-1 md:px-3">Métricas</TabsTrigger>
                    <TabsTrigger value="quantity" className="text-xs md:text-sm px-1 md:px-3">Cant. Total KG</TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="daily" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {dailyTab}
                </Suspense>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {monthlyTab}
                </Suspense>
            </TabsContent>

            <TabsContent value="products" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {productsTab}
                </Suspense>
            </TabsContent>

            <TabsContent value="categories" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {categoriesTab}
                </Suspense>
            </TabsContent>

            <TabsContent value="payments" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {paymentsTab}
                </Suspense>
            </TabsContent>

            <TabsContent value="frequency" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {frequencyTab}
                </Suspense>
            </TabsContent>

            <TabsContent value="quantity" className="space-y-4">
                <Suspense fallback={<AnalyticsSkeleton />}>
                    {quantityTab}
                </Suspense>
            </TabsContent>
        </Tabs>
    );
} 