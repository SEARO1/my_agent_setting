---
name: secure-routes
description: Automatically secure routes and endpoints when protection is needed
version: 1.0.0
triggers:
  - adding protected routes
  - implementing authorization
  - setting up role-based access
  - creating API endpoints
auto_load: true
---

# Secure Routes Skill

Automatically implements route protection and authorization when security patterns are detected.

## Detection Patterns

Activates when detecting:
- Route protection requirements
- Authorization checks
- Role-based access control
- API endpoint security
- Admin panel creation

## Implementation

### 1. Route Protection Middleware

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function authMiddleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define route protection rules
  const rules = {
    '/admin/*': { requireAuth: true, requireRole: 'admin' },
    '/dashboard/*': { requireAuth: true },
    '/api/protected/*': { requireAuth: true },
    '/profile': { requireAuth: true },
    '/settings': { requireAuth: true },
  }

  const path = req.nextUrl.pathname

  for (const [pattern, rule] of Object.entries(rules)) {
    if (matchPath(path, pattern)) {
      if (rule.requireAuth && !session) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      if (rule.requireRole && session) {
        const userRole = session.user.user_metadata?.role
        if (userRole !== rule.requireRole) {
          return NextResponse.redirect(new URL('/unauthorized', req.url))
        }
      }
    }
  }

  return res
}

function matchPath(path: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
  return regex.test(path)
}
```

### 2. Role-Based Access Control

```typescript
// lib/rbac.ts
import { User } from '@supabase/supabase-js'

export enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

export enum Permission {
  CREATE_POST = 'create_post',
  EDIT_POST = 'edit_post',
  DELETE_POST = 'delete_post',
  MANAGE_USERS = 'manage_users',
  VIEW_ANALYTICS = 'view_analytics'
}

const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.CREATE_POST,
    Permission.EDIT_POST,
    Permission.DELETE_POST,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS
  ],
  [Role.MODERATOR]: [
    Permission.CREATE_POST,
    Permission.EDIT_POST,
    Permission.DELETE_POST,
    Permission.VIEW_ANALYTICS
  ],
  [Role.USER]: [
    Permission.CREATE_POST,
    Permission.EDIT_POST
  ],
  [Role.GUEST]: []
}

export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false

  const role = (user.user_metadata?.role as Role) || Role.USER
  return rolePermissions[role]?.includes(permission) || false
}

export const requirePermission = (user: User | null, permission: Permission): void => {
  if (!hasPermission(user, permission)) {
    throw new Error('Insufficient permissions')
  }
}
```

### 3. Protected API Routes

```typescript
// app/api/protected/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { hasPermission, Permission } from '@/lib/rbac'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  // Check authentication
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Check permissions
  if (!hasPermission(session.user, Permission.VIEW_ANALYTICS)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  // Protected logic here
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Validate request body
  const body = await request.json()

  // Rate limiting
  const rateLimitKey = `api:${session.user.id}:${new Date().getMinutes()}`
  const { count } = await supabase
    .from('rate_limits')
    .select('count')
    .eq('key', rateLimitKey)
    .single()

  if (count && count > 10) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }

  // Process request...
  return NextResponse.json({ success: true })
}
```

### 4. Component-Level Protection

```typescript
// components/ProtectedComponent.tsx
import { useAuth } from '@/contexts/AuthContext'
import { hasPermission, Permission } from '@/lib/rbac'

export const ProtectedComponent: React.FC<{
  permission?: Permission
  fallback?: React.ReactNode
  children: React.ReactNode
}> = ({ permission, fallback, children }) => {
  const { user } = useAuth()

  if (!user) {
    return <>{fallback || <div>Please log in to continue</div>}</>
  }

  if (permission && !hasPermission(user, permission)) {
    return <>{fallback || <div>You don't have permission to view this</div>}</>
  }

  return <>{children}</>
}

// Usage
<ProtectedComponent permission={Permission.MANAGE_USERS}>
  <AdminPanel />
</ProtectedComponent>
```

### 5. Database-Level Security

```sql
-- Row Level Security Policies
-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only read their own posts
CREATE POLICY "Users can read own posts"
ON posts FOR SELECT
USING (auth.uid() = user_id);

-- Admins can read all posts
CREATE POLICY "Admins can read all posts"
ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON posts FOR UPDATE
USING (auth.uid() = user_id);

-- Only verified users can create posts
CREATE POLICY "Verified users can create posts"
ON posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.email_verified = true
  )
);
```

## Security Headers

```typescript
// middleware/security.ts
export function securityHeaders(response: NextResponse) {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval';"
  )
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  return response
}
```

## Automatic Features

- Route protection based on patterns
- Role-based access control
- API endpoint security
- Rate limiting
- CSRF protection
- Security headers
- Audit logging