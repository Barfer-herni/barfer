import { redirect } from 'next/navigation';
import { signIn } from '@repo/data-services/src/services/authService';
import { Dictionary } from '@repo/internationalization';
import { SignInButton } from './SignInButton';
import { PasswordInput } from './PasswordInput';
import Link from 'next/link';

interface SignInProps {
    dictionary?: Dictionary;
}

async function handleSignIn(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return;
    }

    try {
        const result = await signIn({ email, password });

        console.log('result', result);


        if (result.success) {
            redirect('/'); // Dejar que el middleware determine la redirección
        }
    } catch (err) {
        // No capturar NEXT_REDIRECT como error
        if (err instanceof Error && err.message.includes('NEXT_REDIRECT')) {
            throw err; // Re-throw para que Next.js maneje el redirect
        }
        console.error('Sign in error:', err);
    }
}

export const SignIn = ({ dictionary }: SignInProps) => {
    return (
        <div className="grid gap-6">
            <form action={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-900 dark:text-white">
                        {dictionary?.app?.auth?.signIn?.email || 'Correo Electrónico'}
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
                    label={dictionary?.app?.auth?.signIn?.password || 'Contraseña'}
                    placeholder="••••••••"
                    required
                />

                <SignInButton dictionary={dictionary} />
            </form>

            {/* Navigation to Sign Up */}
            <div className="text-center">
                <Link
                    href="/sign-up"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                >
                    {dictionary?.app?.auth?.signIn?.goToSignUp || '¿No tienes cuenta? Crear cuenta'}
                </Link>
            </div>
        </div>
    );
}; 