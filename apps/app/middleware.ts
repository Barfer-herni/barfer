import { NextRequest, NextResponse } from 'next/server';
import {
  noseconeMiddleware,
  noseconeOptions,
  noseconeOptionsWithToolbar,
} from '@repo/security/middleware';
import { env } from './env';
import { internationalizationMiddleware } from '@repo/internationalization/middleware';
// Dynamic role system - easily extendable
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  // Add more roles as needed
} as const;

type Role = typeof ROLES[keyof typeof ROLES];

// Permission-based route access
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/admin/analytics': ['analytics:view'],
  '/admin/clients': ['clients:view'],
  '/admin/clients/email': ['clients:send_email'],
  '/admin/clients/whatsapp': ['clients:send_whatsapp'],
  '/admin/account': ['account:view_own'], // Todos pueden ver su cuenta
  '/admin/table': ['table:view'],
  '/admin/balance': ['balance:view'],
  '/admin/outputs': ['outputs:view'],
  '/admin/salidas': ['outputs:view'], // Salidas es la ruta en español para outputs
  '/admin/prices': ['prices:view'],
  '/admin/repartos': ['table:view'], // Usar el mismo permiso que table por ahora
  '/admin/mayoristas': ['mayoristas:view'],
};

// Role configuration with route permissions
interface RoleConfig {
  defaultRedirect: string;
  allowedRoutes: string[];
}

// Función para determinar la redirección por defecto basada en permisos
const getDefaultRedirect = (userRole: Role, userPermissions: string[]): string => {
  if (userRole === ROLES.ADMIN) {
    return '/admin/analytics';
  }

  // Para usuarios normales, redirigir según sus permisos
  if (userPermissions.includes('analytics:view')) {
    return '/admin/analytics';
  } else if (userPermissions.includes('clients:view')) {
    return '/admin/clients';
  } else {
    // Por defecto, siempre pueden ir a su cuenta
    return '/admin/account';
  }
};

// Map roles to their configurations
const ROLE_CONFIGURATION: Record<Role, RoleConfig> = {
  [ROLES.ADMIN]: {
    defaultRedirect: '/admin/analytics',
    allowedRoutes: ['/admin']
  },
  [ROLES.USER]: {
    defaultRedirect: '/admin/account',
    allowedRoutes: ['/admin']
  }
};

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/sign-in',
  '/sign-up',
  '/api/webhooks',
  '/api/cron',
  '/access-denied',
];

// Authentication cookie name
const AUTH_COOKIE_NAME = 'auth-token';

// Security middleware
const securityHeaders = env.FLAGS_SECRET
  ? noseconeMiddleware(noseconeOptionsWithToolbar)
  : noseconeMiddleware(noseconeOptions);

// Check if a route is a public route
const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
};

// Check if the URL path is within the authenticated route group
const isAuthenticatedRoute = (pathname: string): boolean => {
  // All routes except those in PUBLIC_ROUTES are considered authenticated
  return !isPublicRoute(pathname);
};

// Check if user has access to the current route based on their permissions
const hasAccessToRoute = (pathname: string, userRole: Role, userPermissions: string[] = []): boolean => {
  // Admins always have access
  if (userRole === ROLES.ADMIN) return true;

  // Check if the specific route requires permissions
  const routePermissions = ROUTE_PERMISSIONS[pathname];
  if (routePermissions) {
    // Check if user has at least one of the required permissions
    return routePermissions.some(permission => userPermissions.includes(permission));
  }

  // Para rutas /admin/* que NO están en ROUTE_PERMISSIONS, DENEGAR acceso
  // Solo permitir acceso a rutas específicamente definidas
  if (pathname.startsWith('/admin')) {
    return false;
  }

  // For other routes not in ROUTE_PERMISSIONS, fall back to role-based access
  if (!ROLE_CONFIGURATION[userRole]) return false;
  return ROLE_CONFIGURATION[userRole].allowedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
};

// Determine user role from session claims
const getUserRole = (role?: string): Role => {
  if (!role) return ROLES.USER;

  // Normalizar a minúsculas
  const roleStr = role.toLowerCase();

  // Check for admin role
  if (roleStr === ROLES.ADMIN) {
    return ROLES.ADMIN;
  }

  // Add more role checks as needed
  // if (roleStr === ROLES.PROFESSIONAL) {
  //   return ROLES.PROFESSIONAL;
  // }

  // Default to USER role
  return ROLES.USER;
};

export async function middleware(req: NextRequest): Promise<NextResponse | Response | null | undefined> {
  // Primero aplicar middleware de internacionalización
  const i18nResponse = internationalizationMiddleware({
    headers: req.headers,
    nextUrl: req.nextUrl
  });
  if (i18nResponse) {
    return i18nResponse;
  }

  const { pathname } = req.nextUrl;

  // Extraer el locale de la URL
  const locale = pathname.match(/^\/([a-z]{2})(?:\/|$)/)?.[1] || 'es';
  const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(?:\/|$)/, '/');

  // Always allow public routes
  if (isPublicRoute(pathnameWithoutLocale)) {
    return await securityHeaders();
  }

  // Get authentication cookie
  const tokenCookie = req.cookies.get(AUTH_COOKIE_NAME);
  let userId: string | undefined;
  let userRole: Role = ROLES.USER;
  let userPermissions: string[] = [];

  // Parse token if it exists and verify user authorization
  if (tokenCookie) {
    try {
      const token = JSON.parse(tokenCookie.value);
      userId = token.id;
      userRole = getUserRole(token.role);
      userPermissions = token.permissions || [];

      // Check if user has any permissions (except for admins who always have permissions)
      if (userRole !== ROLES.ADMIN && userPermissions.length === 0) {
        // Usuario sin permisos - redirigir a access-denied
        return NextResponse.redirect(new URL(`/${locale}/access-denied`, req.url));
      }
    } catch (error) {
      console.error('Error parsing auth token:', error);
    }
  }

  // User is not authenticated but trying to access an authenticated route
  if (!userId && isAuthenticatedRoute(pathnameWithoutLocale)) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in`, req.url));
  }

  // User is authenticated
  if (userId) {
    // Root path redirect to permission-based dashboard
    if (pathnameWithoutLocale === '/' || pathnameWithoutLocale === '') {
      const redirectUrl = getDefaultRedirect(userRole, userPermissions);
      return NextResponse.redirect(new URL(`/${locale}${redirectUrl}`, req.url));
    }

    // Check permissions for /admin routes
    if (pathnameWithoutLocale.startsWith('/admin')) {
      // Check specific route permissions first
      if (!hasAccessToRoute(pathnameWithoutLocale, userRole, userPermissions)) {
        return NextResponse.redirect(new URL(`/${locale}/access-denied`, req.url));
      }
      return await securityHeaders();
    }

    // If trying to access other routes, check permissions
    if (!hasAccessToRoute(pathnameWithoutLocale, userRole, userPermissions)) {
      return NextResponse.redirect(new URL(`/${locale}/access-denied`, req.url));
    }
  }

  // Apply security headers
  return await securityHeaders();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!api|_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    // '/(api|trpc)(.*)', // Comentamos para que el middleware no se ejecute en rutas de api
  ],
};
