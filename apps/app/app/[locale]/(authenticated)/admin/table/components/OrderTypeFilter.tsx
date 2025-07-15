'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';

export function OrderTypeFilter() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const currentOrderType = searchParams.get('orderType') || 'all';

    const handleOrderTypeChange = (value: string) => {
        const params = new URLSearchParams(searchParams);

        if (value && value !== 'all') {
            params.set('orderType', value);
        } else {
            params.delete('orderType');
        }

        // Reset to first page when filtering
        params.set('page', '1');

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Tipo Orden:</span>
            <Select value={currentOrderType} onValueChange={handleOrderTypeChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="minorista">Minorista</SelectItem>
                    <SelectItem value="mayorista">Mayorista</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
} 