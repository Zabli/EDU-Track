import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  const { pathname } = request.nextUrl;

  // Protected route prefixes
  const protectedPrefixes = ['/admin', '/owner', '/teacher', '/student'];
  const isProtectedRoute = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtectedRoute) {
    return response;
  }

  // Check auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Fetch role & platform_role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, platform_role, account_status, academy_id')
    .eq('id', user.id)
    .single();

  if (!profile || profile.account_status === 'suspended') {
    const suspendedUrl = new URL('/login', request.url);
    suspendedUrl.searchParams.set('error', 'account_suspended');
    return NextResponse.redirect(suspendedUrl);
  }

  // Enforce role-based access boundaries
  if (pathname.startsWith('/admin')) {
    if (profile.platform_role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  } else if (pathname.startsWith('/owner')) {
    if (profile.role !== 'owner' && profile.platform_role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  } else if (pathname.startsWith('/teacher')) {
    if (profile.role !== 'teacher' && profile.platform_role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  } else if (pathname.startsWith('/student')) {
    if (profile.role !== 'student' && profile.platform_role !== 'platform_admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/owner/:path*',
    '/teacher/:path*',
    '/student/:path*',
  ],
};
