import { redirect } from 'next/navigation';
import { signUp } from '@repo/data-services/src/services/authService';
import { Dictionary } from '@repo/internationalization';
import { SignUpButton } from './SignUpButton';
import { PasswordInput } from './PasswordInput';
import Link from 'next/link';

interface SignUpProps {
    dictionary?: Dictionary;
    error?: string;
}

async function handleSignUp(formData: FormData) {
    'use server';

    const name = formData.get('name') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name || !lastName || !email || !password || !confirmPassword) {
        redirect('/sign-up?error=empty-fields');
    }

    if (password !== confirmPassword) {
        redirect('/sign-up?error=passwords-mismatch');
    }

    try {
        const result = await signUp({
            name,
            lastName,
            email,
            password
        });

        if (result.success) {
            redirect('/sign-in'); // Dejar que el middleware determine la redirección
        } else {
            redirect('/sign-up?error=creation-failed');
        }
    } catch (err) {
        // No capturar NEXT_REDIRECT como error
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
            throw err; // Re-throw para que Next.js maneje el redirect
        }
        console.error('Sign up error:', err);
        redirect('/sign-up?error=generic');
    }
}

export const SignUp = ({ dictionary, error }: SignUpProps) => {
    return (
        <div className="grid gap-6">
            <form action={handleSignUp} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-md bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-gray-900 dark:text-white">
                        {dictionary?.app?.auth?.signUp?.firstName || 'Nombre'}
                    </label>
                    <input
                        name="name"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={dictionary?.app?.auth?.signUp?.firstName || 'Nombre'}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-900 dark:text-white">
                        {dictionary?.app?.auth?.signUp?.lastName || 'Apellido'}
                    </label>
                    <input
                        name="lastName"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={dictionary?.app?.auth?.signUp?.lastName || 'Apellido'}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
                        {dictionary?.app?.auth?.signUp?.email || 'Correo Electrónico'}
                    </label>
                    <input
                        name="email"
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="correo@ejemplo.com"
                        required
                    />
                </div>

                <PasswordInput
                    name="password"
                    label={dictionary?.app?.auth?.signUp?.password || 'Contraseña'}
                    placeholder="••••••••"
                    required
                />

                <PasswordInput
                    name="confirmPassword"
                    label={dictionary?.app?.auth?.signUp?.confirmPassword || 'Confirmar Contraseña'}
                    placeholder="••••••••"
                    required
                />

                <SignUpButton dictionary={dictionary} />
            </form>

            {/* Navigation to Sign In */}
            <div className="text-center">
                <Link
                    href="/sign-in"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                    {dictionary?.app?.auth?.signUp?.goToSignIn || '¿Ya tienes cuenta? Inicia sesión'}
                </Link>
            </div>
        </div>
    );
}; 