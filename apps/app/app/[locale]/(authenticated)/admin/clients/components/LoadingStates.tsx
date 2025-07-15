'use client';

import { Card, CardContent, CardHeader } from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';

/**
 * Loading state para las estadísticas generales de clientes
 */
export function ClientStatsLoading() {
    return (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-3 xs:h-4 w-16 xs:w-20" />
                        <Skeleton className="h-3 xs:h-4 w-3 xs:w-4 rounded" />
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Skeleton className="h-6 xs:h-8 sm:h-10 w-12 xs:w-16 sm:w-20 mb-1" />
                        <Skeleton className="h-2 xs:h-3 w-20 xs:w-24" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

/**
 * Loading state para las tarjetas de categorías de clientes
 */
export function ClientCategoriesLoading() {
    return (
        <div className="space-y-6">
            {/* Tabs skeleton */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
            </div>

            {/* Category cards skeleton */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="h-[280px]">
                        <CardHeader className="pb-3 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <Skeleton className="h-6 w-24" />
                                <div className="text-right">
                                    <Skeleton className="h-8 w-8 mb-1" />
                                    <Skeleton className="h-3 w-8" />
                                </div>
                            </div>
                            <Skeleton className="h-12 w-full" />
                        </CardHeader>
                        <CardContent className="pt-0 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                            <div className="flex gap-2 pt-4 border-t">
                                <Skeleton className="h-8 flex-1" />
                                <Skeleton className="h-8 flex-1" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

/**
 * Loading state para tablas de clientes
 */
export function ClientTableLoading() {
    return (
        <div className="space-y-4">
            {/* Table header */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-32" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-20" />
                </div>
            </div>

            {/* Table skeleton */}
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-0">
                        {/* Header row */}
                        <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-4 w-full" />
                            ))}
                        </div>

                        {/* Data rows */}
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b">
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <Skeleton key={j} className="h-4 w-full" />
                                ))}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination skeleton */}
            <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-48" />
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    );
}

/**
 * Loading state para la página completa
 */
export function ClientsPageLoading() {
    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Header */}
            <div className="space-y-2">
                <Skeleton className="h-8 sm:h-10 w-64" />
                <Skeleton className="h-4 sm:h-5 w-96" />
            </div>

            {/* Stats */}
            <ClientStatsLoading />

            {/* Categories */}
            <ClientCategoriesLoading />
        </div>
    );
} 