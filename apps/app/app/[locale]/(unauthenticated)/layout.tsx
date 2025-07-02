import { ModeToggle } from '@repo/design-system/components/mode-toggle';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Image from 'next/image';
import logo from '@/app/public/logo.png';
import { getDictionary } from '@repo/internationalization';

type AuthLayoutProps = {
  readonly children: ReactNode;
  readonly params: Promise<{ locale: string }>;
};

const AuthLayout = async ({ children, params }: AuthLayoutProps) => {
  const { locale } = await params;
  const dictionary = await getDictionary(locale);
  const title = dictionary.app.auth.layout.title;
  const description = dictionary.app.auth.layout.description;

  return (
    <div className="grid w-full min-h-screen lg:grid-cols-2 bg-white dark:bg-black text-gray-900 dark:text-white">
      {/* Left panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between bg-gray-100 dark:bg-zinc-900 p-10 relative overflow-hidden">
        <div className="absolute w-full h-full left-0 top-0 bg-gradient-to-br from-gray-100 via-gray-100 to-gray-200 dark:from-zinc-900 dark:via-zinc-900 dark:to-black z-0" />

        {/* Decorative circles */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-400/10 rounded-full filter blur-3xl opacity-30" />
        <div className="absolute right-32 top-1/3 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl opacity-20" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-400/10 rounded-full filter blur-3xl opacity-30" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image src={logo} alt="Barfer" width={32} height={32} />
              <span className="font-bold text-2xl text-gray-900 dark:text-white">Barfer</span>
            </Link>
            <div className="flex items-center gap-2">
              <ModeToggle />
              {/* <LanguageSwitcher /> */}
            </div>
          </div>
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            <p className="text-lg mt-4 text-gray-700 dark:text-gray-300">
              {description}
            </p>
          </div>
        </div>

      </div>

      {/* Right panel (form) */}
      <div className="flex flex-col justify-center p-8 md:p-12 bg-white dark:bg-zinc-950">
        <div className="lg:hidden flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} alt="Barfer" width={32} height={32} />
            <span className="font-bold text-xl text-gray-900 dark:text-white">Barfer</span>
          </Link>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>

        {/* Description visible only on mobile */}
        <div className="lg:hidden mb-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          <p className="text-md mt-4 text-gray-700 dark:text-gray-300">
            {description}
          </p>
        </div>

        <div className="max-w-md mx-auto w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
