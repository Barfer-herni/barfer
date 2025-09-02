import type { ReactNode } from 'react';
import { getDictionary } from '@repo/internationalization';
import { AdminSidebar } from '../components/sidebar-components/admin-sidebar';
import { UserHeaderClient } from '../components/user-header/userHeaderClient';
import { getCurrentUser } from '@repo/data-services/src/services/authService';
import Image from 'next/image';
import logo from '@/app/public/logo.png';

type AdminLayoutProps = {
    readonly children: ReactNode;
    readonly params: Promise<{
        locale: string;
    }>;
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
    const { locale } = await params;
    const dictionary = await getDictionary(locale);
    const currentUser = await getCurrentUser();

    return (
        <div className="flex w-full min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">
            <UserHeaderClient
                logo={<Image src={logo} alt="Barfer" width={32} height={32} />}
                title="Barfer"
                dictionary={dictionary}
                locale={locale}
                user={currentUser}
            />

            <div className="pt-16 flex w-full h-full">
                <AdminSidebar dictionary={dictionary} />

                <main className="bg-gray-50 dark:bg-zinc-950 flex-1 md:py-6 min-h-screen pb-20 md:pb-0">
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
} 