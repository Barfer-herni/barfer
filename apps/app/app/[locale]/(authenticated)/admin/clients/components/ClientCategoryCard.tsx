'use client';

import { Card, CardContent, CardDescription, CardHeader } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { Users, TrendingUp, Clock, Mail, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ClientCategoryStats, ClientBehaviorCategory, ClientSpendingCategory } from '@repo/data-services';
import type { Dictionary } from '@repo/internationalization';

interface ClientCategoryCardProps {
    category: ClientCategoryStats;
    type: 'behavior' | 'spending';
    dictionary: Dictionary;
    canSendEmail?: boolean;
    canSendWhatsApp?: boolean;
}

const getCategoryColor = (category: ClientBehaviorCategory | ClientSpendingCategory, type: 'behavior' | 'spending'): string => {
    if (type === 'behavior') {
        const behaviorColors: Record<ClientBehaviorCategory, string> = {
            'new': 'bg-blue-100 text-blue-800 border-blue-200',
            'possible-inactive': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'active': 'bg-emerald-100 text-emerald-800 border-emerald-200',
            'recovered': 'bg-purple-100 text-purple-800 border-purple-200',
            'lost': 'bg-red-100 text-red-800 border-red-200',
            'tracking': 'bg-indigo-100 text-indigo-800 border-indigo-200'
        };
        return behaviorColors[category as ClientBehaviorCategory];
    } else {
        const spendingColors: Record<ClientSpendingCategory, string> = {
            'premium': 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-900 border-yellow-300',
            'standard': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-900 border-blue-300',
            'basic': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 border-gray-300'
        };
        return spendingColors[category as ClientSpendingCategory];
    }
};

const getCategoryIcon = (category: ClientBehaviorCategory | ClientSpendingCategory, type: 'behavior' | 'spending') => {
    if (type === 'behavior') {
        const icons: Record<ClientBehaviorCategory, React.ReactNode> = {
            'new': <Users className="h-4 w-4" />,
            'possible-inactive': <Clock className="h-4 w-4" />,
            'active': <TrendingUp className="h-4 w-4" />,
            'recovered': <TrendingUp className="h-4 w-4" />,
            'lost': <Users className="h-4 w-4" />,
            'tracking': <Clock className="h-4 w-4" />
        };
        return icons[category as ClientBehaviorCategory];
    } else {
        return <TrendingUp className="h-4 w-4" />;
    }
};

const getCategoryTitle = (category: ClientBehaviorCategory | ClientSpendingCategory, dictionary: Dictionary): string => {
    const categoriesDict = dictionary.app.admin?.clients?.categories || {};
    const titles: Record<string, string> = {
        'new': categoriesDict.new || 'Cliente Nuevo',
        'possible-active': categoriesDict.possibleActive || 'Posible Activo',
        'possible-inactive': categoriesDict.possibleInactive || 'Posible Inactivo',
        'active': categoriesDict.active || 'Cliente Activo',
        'inactive': categoriesDict.inactive || 'Cliente Inactivo',
        'recovered': categoriesDict.recovered || 'Cliente Recuperado',
        'lost': categoriesDict.lost || 'Cliente Perdido',
        'tracking': categoriesDict.tracking || 'En Seguimiento',
        'premium': categoriesDict.premium || 'Premium (A)',
        'standard': categoriesDict.standard || 'Estándar (B)',
        'basic': categoriesDict.basic || 'Básico (C)'
    };
    return titles[category] || category;
};

const getCategoryDescription = (category: ClientBehaviorCategory | ClientSpendingCategory, type: 'behavior' | 'spending'): string => {
    const descriptions: Record<string, string> = {
        'new': 'Cliente con 1 sola compra, realizada en la última semana.',
        'tracking': 'Cliente con 1 sola compra, realizada entre 8 y 30 días.',
        'active': 'Cliente con al menos una compra en los últimos 90 días.',
        'possible-inactive': 'Última compra entre 90 y 120 días.',
        'recovered': 'Volvió a comprar en los últimos 90 días después de +120 días de inactividad.',
        'lost': 'No ha comprado en más de 120 días.',
        'premium': 'Ha comprado más de 15 kg en el último mes.',
        'standard': 'Ha comprado entre 5 y 15 kg en el último mes.',
        'basic': 'Ha comprado menos de 5 kg en el último mes.'
    };

    return descriptions[category] || '';
};

const getCategoryKgRange = (category: ClientSpendingCategory): string => {
    const kgRanges: Record<ClientSpendingCategory, string> = {
        'premium': '> 15 kg',
        'standard': '5 - 15 kg',
        'basic': '<= 5 kg'
    };
    return kgRanges[category] ?? '';
};

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(amount);
};

export function ClientCategoryCard({
    category,
    type,
    dictionary,
    canSendEmail = false,
    canSendWhatsApp = false
}: ClientCategoryCardProps) {
    const router = useRouter();
    const colorClasses = getCategoryColor(category.category, type);
    const icon = getCategoryIcon(category.category, type);
    const title = getCategoryTitle(category.category, dictionary);
    const description = getCategoryDescription(category.category, type);
    const kgRange = type === 'spending' ? getCategoryKgRange(category.category as ClientSpendingCategory) : null;

    const handleEmailClick = () => {
        router.push(`/admin/clients/email?category=${category.category}&type=${type}`);
    };

    const handleWhatsAppClick = () => {
        router.push(`/admin/clients/whatsapp?category=${category.category}&type=${type}`);
    };

    return (
        <Card className="h-full min-h-[280px] hover:shadow-md transition-shadow flex flex-col">
            <CardHeader className="pb-3 space-y-3 flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className={`${colorClasses} px-1 sm:px-2 py-1 text-[10px] xs:text-xs font-medium flex-shrink-0 max-w-[120px] xs:max-w-none`}>
                        <div className="flex items-center gap-1 min-w-0">
                            {icon}
                            <span className="hidden sm:inline truncate">{title}</span>
                            <span className="sm:hidden truncate text-[9px] xs:text-[10px]">
                                {title.includes('(') ? title.split('(')[0].trim() : title.split(' ')[0]}
                            </span>
                        </div>
                    </Badge>
                    <div className="text-right flex-shrink-0 min-w-[40px]">
                        <div className="text-lg xs:text-xl sm:text-2xl font-bold">{category.count}</div>
                        <div className="text-[10px] xs:text-xs text-muted-foreground">{category.percentage}%</div>
                    </div>
                </div>
                <CardDescription className="text-[11px] xs:text-xs sm:text-sm leading-relaxed">
                    {description}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex-1 flex flex-col justify-between">
                <div className="space-y-2 flex-1">
                    <div className="flex justify-between text-[10px] xs:text-xs sm:text-sm gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Total:</span>
                        <span className="font-medium text-right truncate min-w-0">{formatCurrency(category.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] xs:text-xs sm:text-sm gap-2">
                        <span className="text-muted-foreground flex-shrink-0">Promedio:</span>
                        <span className="font-medium text-right truncate min-w-0">{formatCurrency(category.averageSpending)}</span>
                    </div>
                    {type === 'spending' && kgRange && (
                        <div className="flex justify-between text-[10px] xs:text-xs sm:text-sm gap-2">
                            <span className="text-muted-foreground flex-shrink-0">{dictionary.app.admin.clients.categories.kgRange ?? 'Rango KG'}:</span>
                            <span className="font-medium text-right truncate min-w-0">{kgRange}</span>
                        </div>
                    )}
                </div>

                {/* Action buttons - only show if user has at least one permission */}
                {(canSendEmail || canSendWhatsApp) && (
                    <div className="flex gap-2 pt-4 border-t border-border mt-auto">
                        {canSendEmail && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleEmailClick}
                                className="flex-1 h-8 text-xs"
                            >
                                <Mail className="h-3 w-3 mr-1" />
                                Email
                            </Button>
                        )}
                        {canSendWhatsApp && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleWhatsAppClick}
                                className="flex-1 h-8 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                            >
                                <MessageCircle className="h-3 w-3 mr-1" />
                                WhatsApp
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 