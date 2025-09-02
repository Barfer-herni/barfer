'use client';

import { Avatar, AvatarFallback } from '@repo/design-system/components/ui/avatar';
import { Button } from '@repo/design-system/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@repo/design-system/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';
import { useTransition } from 'react';
import { Dictionary } from '@repo/internationalization';
import { logoutAction } from '../actions';
import Link from 'next/link';

interface LogoutButtonProps {
    userName?: string;
    userLastName?: string;
    dictionary?: Dictionary;
    locale?: string;
}

export function LogoutButton({ userName, userLastName, dictionary, locale = 'es' }: LogoutButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleLogout = () => {
        startTransition(async () => {
            await logoutAction(locale);
        });
    };

    const logoutText = dictionary?.app?.admin?.navigation?.logout ||
        dictionary?.app?.client?.navigation?.logout ||
        dictionary?.app?.pharmacy?.navigation?.logout ||
        'Cerrar sesión';
    const loggingOutText = dictionary?.app?.admin?.navigation?.loggingOut ||
        dictionary?.app?.client?.navigation?.loggingOut ||
        dictionary?.app?.pharmacy?.navigation?.loggingOut ||
        'Cerrando sesión...';

    const profileText = dictionary?.app?.admin?.navigation?.profile ||
        dictionary?.app?.client?.navigation?.profile ||
        dictionary?.app?.pharmacy?.navigation?.profile ||
        'Mi perfil';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Usuario"
                >
                    <Avatar>
                        <AvatarFallback>
                            <User className="h-4 w-4" />
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/${locale}/admin/account`}>
                        <User className="mr-2 h-4 w-4" />
                        {profileText}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isPending}
                    className="text-destructive dark:text-red-400 focus:text-destructive dark:focus:text-red-300"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    {isPending ? loggingOutText : logoutText}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
} 