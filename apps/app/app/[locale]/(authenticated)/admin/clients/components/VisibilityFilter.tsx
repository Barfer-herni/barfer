'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Eye, EyeOff, Users } from 'lucide-react';

export type VisibilityFilterType = 'all' | 'hidden' | 'visible';

interface VisibilityFilterProps {
    currentFilter: VisibilityFilterType;
    onFilterChange: (filter: VisibilityFilterType) => void;
    className?: string;
}

const filterOptions = [
    {
        value: 'all' as const,
        label: 'Todos',
        icon: Users
    },
    {
        value: 'hidden' as const,
        label: 'Ocultados',
        icon: EyeOff
    },
    {
        value: 'visible' as const,
        label: 'Visibles',
        icon: Eye
    }
];

export function VisibilityFilter({
    currentFilter,
    onFilterChange,
    className
}: VisibilityFilterProps) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {filterOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = currentFilter === option.value;

                return (
                    <Button
                        key={option.value}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onFilterChange(option.value);
                        }}
                        className="flex items-center gap-1 text-xs"
                    >
                        <Icon className="h-3 w-3" />
                        {option.label}
                    </Button>
                );
            })}
        </div>
    );
} 