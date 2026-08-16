---
name: implement-auth
description: Automatically implement authentication when auth-related code is detected
version: 1.0.0
triggers:
  - creating auth components
  - setting up user authentication
  - implementing login/signup
  - adding protected routes
auto_load: true
---

# Implement Authentication Skill

Automatically implements complete authentication flows when auth-related patterns are detected.

## Detection Patterns

This skill activates when detecting:
- Auth-related imports (`@supabase/auth-helpers`, `supabase.auth`)
- Login/Signup component creation
- Protected route implementation
- Session management code
- JWT token handling

## Actions Performed

### 1. Create Auth Context

```typescript
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, session, signIn, signUp, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### 2. Create Login Component

```typescript
// components/auth/LoginForm.tsx
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) setError(error.message)
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="oauth-buttons">
        <button type="button" onClick={() => handleOAuthSignIn('google')}>
          Sign in with Google
        </button>
        <button type="button" onClick={() => handleOAuthSignIn('github')}>
          Sign in with GitHub
        </button>
      </div>
    </form>
  )
}
```

### 3. Create Protected Route

```typescript
// components/auth/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
```

### 4. Set Up Middleware

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const protectedPaths = ['/dashboard', '/profile', '/settings']
  const isProtectedPath = protectedPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Redirect to dashboard if logged in and accessing auth pages
  const authPaths = ['/login', '/signup']
  const isAuthPath = authPaths.some(path =>
    req.nextUrl.pathname.startsWith(path)
  )

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/settings/:path*', '/login', '/signup']
}
```

### 5. Add Session Refresh

```typescript
// utils/auth.ts
import { supabase } from '@/lib/supabase'

export const refreshSession = async () => {
  const { data: { session }, error } = await supabase.auth.refreshSession()
  if (error) {
    console.error('Error refreshing session:', error)
    return null
  }
  return session
}

// Auto-refresh session before expiry
export const setupSessionRefresh = () => {
  setInterval(async () => {
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      const expiresAt = new Date(session.expires_at! * 1000)
      const now = new Date()
      const timeUntilExpiry = expiresAt.getTime() - now.getTime()

      // Refresh if less than 5 minutes until expiry
      if (timeUntilExpiry < 5 * 60 * 1000) {
        await refreshSession()
      }
    }
  }, 60 * 1000) // Check every minute
}
```

## Configuration

The skill automatically:
1. Detects framework (React, Next.js, Vue, etc.)
2. Creates appropriate auth components
3. Sets up session management
4. Implements error handling
5. Adds TypeScript types
6. Creates test files

## Best Practices Applied

- Secure session management
- CSRF protection
- XSS prevention
- Proper error handling
- Loading states
- Type safety
- Accessibility support