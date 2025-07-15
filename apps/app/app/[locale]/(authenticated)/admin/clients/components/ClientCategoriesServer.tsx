'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { ClientCategoryCard } from './ClientCategoryCard';
import type { Dictionary } from '@repo/internationalization';
import type { ClientCategoryStats, ClientBehaviorCategory, ClientSpendingCategory } from '@repo/data-services';

interface ClientCategoriesServerProps {
    behaviorCategories: ClientCategoryStats[];
    spendingCategories: ClientCategoryStats[];
    dictionary: Dictionary;
}

export function ClientCategoriesServer({
    behaviorCategories,
    spendingCategories,
    dictionary
}: ClientCategoriesServerProps) {
    const [activeTab, setActiveTab] = useState('behavior');

    const spendingOrder: ClientSpendingCategory[] = ['premium', 'standard', 'basic'];
    const behaviorOrder: ClientBehaviorCategory[] = [
        'active',
        'recovered',
        'new',
        'tracking',
        'possible-inactive',
        'lost'
    ];

    const sortedSpendingCategories = [...spendingCategories].sort(
        (a, b) => spendingOrder.indexOf(a.category as ClientSpendingCategory) - spendingOrder.indexOf(b.category as ClientSpendingCategory)
    );

    const sortedBehaviorCategories = [...behaviorCategories].sort(
        (a, b) => behaviorOrder.indexOf(a.category as ClientBehaviorCategory) - behaviorOrder.indexOf(b.category as ClientBehaviorCategory)
    );

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-auto min-h-[40px] sm:h-11">
                <TabsTrigger
                    value="behavior"
                    className="text-[10px] xs:text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight"
                >
                    <span className="hidden xs:inline">
                        {dictionary.app.admin.clients.categories.behaviorTitle}
                    </span>
                    <span className="xs:hidden">
                        Comportamiento
                    </span>
                </TabsTrigger>
                <TabsTrigger
                    value="spending"
                    className="text-[10px] xs:text-xs sm:text-sm px-1 sm:px-3 py-2 leading-tight"
                >
                    <span className="hidden xs:inline">
                        {dictionary.app.admin.clients.categories.spendingTitle}
                    </span>
                    <span className="xs:hidden">
                        Gasto
                    </span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="behavior" className="mt-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedBehaviorCategories.map((category) => (
                        <ClientCategoryCard
                            key={category.category}
                            category={category}
                            type="behavior"
                            dictionary={dictionary}
                        />
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="spending" className="mt-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3">
                    {sortedSpendingCategories.map((category) => (
                        <ClientCategoryCard
                            key={category.category}
                            category={category}
                            type="spending"
                            dictionary={dictionary}
                        />
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
} 