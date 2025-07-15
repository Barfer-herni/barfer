import { getClientGeneralStats } from '@repo/data-services';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Users, DollarSign, Repeat, ShoppingCart } from 'lucide-react';
import type { Dictionary } from '@repo/internationalization';

interface ClientStatsServerProps {
    dictionary: Dictionary;
}

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0
    }).format(amount);
};

/**
 * Componente Server que obtiene y muestra las estadísticas generales de clientes
 */
export async function ClientStatsServer({ dictionary }: ClientStatsServerProps) {
    const stats = await getClientGeneralStats();

    const statsData = [
        {
            title: dictionary.app.admin.clients.stats.totalClients,
            value: stats.totalClients.toLocaleString(),
            icon: Users,
            description: "Clientes con pedidos",
            color: "text-blue-600"
        },
        {
            title: dictionary.app.admin.clients.stats.averageSpending,
            value: formatCurrency(stats.averageMonthlySpending),
            icon: DollarSign,
            description: "Gasto mensual promedio",
            color: "text-green-600"
        },
        {
            title: dictionary.app.admin.clients.stats.repeatRate,
            value: `${stats.repeatCustomerRate.toFixed(1)}%`,
            icon: Repeat,
            description: "Clientes que repiten",
            color: "text-purple-600"
        },
        {
            title: dictionary.app.admin.clients.stats.averageOrders,
            value: stats.averageOrdersPerCustomer.toFixed(1),
            icon: ShoppingCart,
            description: "Pedidos por cliente",
            color: "text-orange-600"
        }
    ];

    return (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4">
            {statsData.map((stat, index) => {
                const Icon = stat.icon;

                return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-[10px] xs:text-xs sm:text-sm font-medium text-muted-foreground truncate">
                                {stat.title}
                            </CardTitle>
                            <Icon className={`h-3 xs:h-4 w-3 xs:w-4 flex-shrink-0 ${stat.color}`} />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-sm xs:text-lg sm:text-2xl font-bold truncate">{stat.value}</div>
                            <p className="text-[10px] xs:text-xs text-muted-foreground mt-1 leading-tight">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
} 