'use client';

import { cn } from '@repo/design-system/lib/utils';
import {
    User,
    Users,
    BarChart3,
    Table,
    Receipt,
    Tags,
    TrendingUp,
    MinusCircle,
    Truck,
    Store,
} from 'lucide-react';
import Link from 'next/link';
import {
    Sidebar,
    SidebarContent,
    SidebarMenu,
    SidebarMenuItem
} from '@repo/design-system/components/ui/sidebar';
import { usePathname, useSearchParams } from 'next/navigation';
import { Dictionary } from '@repo/internationalization';
import type { SidebarItem } from '@repo/auth/server-permissions';
import { useSidebar } from '@/store/sidebarStore';

// Mapeo de iconos
const ICON_MAP = {
    User,
    Users,
    BarChart3,
    Table,
    Receipt,
    Tags,
    TrendingUp,
    MinusCircle,
    Truck,
    Store,
} as const;

type AdminSidebarClientProps = {
    items: SidebarItem[];
    dictionary: Dictionary;
};

export function AdminSidebarClient({ items, dictionary }: AdminSidebarClientProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get('tab') || 'config';
    const { isCollapsed } = useSidebar();

    const isActivePath = (path: string) => {
        if (path.includes('?tab=')) {
            const [basePath, tab] = path.split('?tab=');
            return pathname.startsWith(basePath) && activeTab === tab;
        }
        return pathname.startsWith(path);
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <Sidebar
                variant="inset"
                className={cn(
                    "hidden md:flex border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 h-full flex-col relative",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <SidebarContent>
                    <SidebarMenu>
                        {items.map((item) => {
                            const IconComponent = ICON_MAP[item.icon as keyof typeof ICON_MAP];
                            const itemLabel = dictionary.app.admin.navigation[item.label as keyof typeof dictionary.app.admin.navigation] || item.label;

                            return (
                                <SidebarMenuItem
                                    key={item.label}
                                    className={cn(
                                        "group relative flex",
                                        isActivePath(item.href) && "text-green-500 bg-green-500/10",
                                        !isActivePath(item.href) && "text-gray-600 dark:text-zinc-400"
                                    )}
                                >
                                    <Link href={item.href} className={cn(
                                        "flex flex-1 items-center gap-3 py-2 rounded-lg w-full hover:bg-gray-100 dark:hover:bg-zinc-800",
                                        isCollapsed ? "px-3 justify-center" : "px-3"
                                    )}>
                                        {IconComponent && <IconComponent className="h-5 w-5 shrink-0" />}
                                        <span className={cn(
                                            "transition-all",
                                            isCollapsed && "sr-only"
                                        )}>
                                            {itemLabel}
                                        </span>
                                    </Link>
                                    {isCollapsed && (
                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap dark:bg-gray-50 dark:text-gray-900">
                                            {itemLabel}
                                        </div>
                                    )}
                                </SidebarMenuItem>
                            );
                        })}
                    </SidebarMenu>
                </SidebarContent>
            </Sidebar>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 z-50 overflow-hidden">
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex items-center gap-1 px-2 py-2 min-w-max">
                        {items.map((item) => {
                            const isActive = isActivePath(item.href);
                            const IconComponent = ICON_MAP[item.icon as keyof typeof ICON_MAP];
                            const mobileTitle = dictionary.app.admin.navigation[item.mobileLabel as keyof typeof dictionary.app.admin.navigation] || item.label;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[70px] transition-colors shrink-0",
                                        isActive
                                            ? "text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400"
                                            : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    {IconComponent && <IconComponent className={cn("h-5 w-5 shrink-0", isActive && "text-green-600 dark:text-green-400")} />}
                                    <span className={cn(
                                        "text-[10px] font-medium text-center leading-tight whitespace-nowrap",
                                        isActive && "text-green-600 dark:text-green-400"
                                    )}>
                                        {mobileTitle}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
} 