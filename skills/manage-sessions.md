---
name: manage-sessions
description: Automatically manage user sessions and authentication state
version: 1.0.0
triggers:
  - handling user sessions
  - implementing session persistence
  - managing auth tokens
  - dealing with session expiry
auto_load: true
---

# Manage Sessions Skill

Automatically implements comprehensive session management when session-related patterns are detected.

## Detection Patterns

Activates when detecting:
- Session storage implementation
- Token refresh logic
- Session persistence requirements
- Multi-tab synchronization
- Session timeout handling

## Implementation

### 1. Session Manager

```typescript
// lib/sessionManager.ts
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export class SessionManager {
  private static instance: SessionManager
  private session: Session | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private listeners: ((session: Session | null) => void)[] = []

  private constructor() {
    this.initialize()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  private async initialize() {
    // Get initial session
    const { data: { session } } = await supabase.auth.getSession()
    this.setSession(session)

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth event: ${event}`)
      this.handleAuthChange(event, session)
    })

    // Set up multi-tab sync
    this.setupMultiTabSync()

    // Set up activity monitoring
    this.setupActivityMonitoring()
  }

  private setSession(session: Session | null) {
    this.session = session
    this.notifyListeners(session)

    if (session) {
      this.scheduleRefresh(session)
      this.persistSession(session)
    } else {
      this.clearRefreshTimer()
      this.clearPersistedSession()
    }
  }

  private handleAuthChange(event: string, session: Session | null) {
    switch (event) {
      case 'SIGNED_IN':
        this.setSession(session)
        this.logActivity('sign_in')
        break
      case 'SIGNED_OUT':
        this.setSession(null)
        this.logActivity('sign_out')
        break
      case 'TOKEN_REFRESHED':
        this.setSession(session)
        break
      case 'USER_UPDATED':
        this.setSession(session)
        break
    }
  }

  private scheduleRefresh(session: Session) {
    this.clearRefreshTimer()

    const expiresAt = new Date(session.expires_at! * 1000)
    const now = new Date()
    const timeUntilExpiry = expiresAt.getTime() - now.getTime()

    // Refresh 5 minutes before expiry
    const refreshTime = Math.max(0, timeUntilExpiry - 5 * 60 * 1000)

    this.refreshTimer = setTimeout(async () => {
      await this.refreshSession()
    }, refreshTime)
  }

  private clearRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  async refreshSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession()

      if (error) {
        console.error('Failed to refresh session:', error)
        this.setSession(null)
        return null
      }

      this.setSession(session)
      return session
    } catch (error) {
      console.error('Error refreshing session:', error)
      this.setSession(null)
      return null
    }
  }

  private persistSession(session: Session) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_session', JSON.stringify(session))
      sessionStorage.setItem('supabase_session_active', 'true')
    }
  }

  private clearPersistedSession() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_session')
      sessionStorage.removeItem('supabase_session_active')
    }
  }

  private setupMultiTabSync() {
    if (typeof window === 'undefined') return

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
      if (e.key === 'supabase_session') {
        if (e.newValue) {
          const session = JSON.parse(e.newValue)
          this.setSession(session)
        } else {
          this.setSession(null)
        }
      }

      if (e.key === 'supabase_logout') {
        this.setSession(null)
        supabase.auth.signOut()
      }
    })

    // Broadcast logout to other tabs
    this.onSession((session) => {
      if (!session) {
        localStorage.setItem('supabase_logout', Date.now().toString())
        localStorage.removeItem('supabase_logout')
      }
    })
  }

  private setupActivityMonitoring() {
    if (typeof window === 'undefined') return

    let lastActivity = Date.now()
    const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

    const updateActivity = () => {
      lastActivity = Date.now()
    }

    // Monitor user activity
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true })
    })

    // Check for idle timeout
    setInterval(() => {
      if (this.session && Date.now() - lastActivity > IDLE_TIMEOUT) {
        console.log('Session expired due to inactivity')
        this.signOut()
      }
    }, 60 * 1000) // Check every minute
  }

  async signOut() {
    await supabase.auth.signOut()
    this.setSession(null)
  }

  getSession(): Session | null {
    return this.session
  }

  getUser(): User | null {
    return this.session?.user || null
  }

  isAuthenticated(): boolean {
    return !!this.session
  }

  onSession(listener: (session: Session | null) => void) {
    this.listeners.push(listener)
    // Immediately call with current session
    listener(this.session)

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(session: Session | null) {
    this.listeners.forEach(listener => listener(session))
  }

  private logActivity(action: string) {
    if (this.session?.user) {
      supabase
        .from('activity_logs')
        .insert({
          user_id: this.session.user.id,
          action,
          timestamp: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error) console.error('Failed to log activity:', error)
        })
    }
  }

  async validateSession(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        this.setSession(null)
        return false
      }

      // Check if session is expired
      const expiresAt = new Date(session.expires_at! * 1000)
      if (expiresAt <= new Date()) {
        const refreshedSession = await this.refreshSession()
        return !!refreshedSession
      }

      this.setSession(session)
      return true
    } catch (error) {
      console.error('Session validation error:', error)
      this.setSession(null)
      return false
    }
  }
}

export const sessionManager = SessionManager.getInstance()
```

### 2. React Hook for Session Management

```typescript
// hooks/useSession.ts
import { useState, useEffect } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { sessionManager } from '@/lib/sessionManager'

export function useSession() {
  const [session, setSession] = useState<Session | null>(sessionManager.getSession())
  const [user, setUser] = useState<User | null>(sessionManager.getUser())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)

    // Validate existing session
    sessionManager.validateSession()
      .then((isValid) => {
        if (!isValid) {
          setSession(null)
          setUser(null)
        }
      })
      .catch((err) => {
        setError(err)
      })
      .finally(() => {
        setLoading(false)
      })

    // Subscribe to session changes
    const unsubscribe = sessionManager.onSession((newSession) => {
      setSession(newSession)
      setUser(newSession?.user || null)
    })

    return unsubscribe
  }, [])

  return {
    session,
    user,
    loading,
    error,
    isAuthenticated: !!session,
    refreshSession: () => sessionManager.refreshSession(),
    signOut: () => sessionManager.signOut()
  }
}
```

### 3. Session Persistence Across Page Reloads

```typescript
// app/layout.tsx
import { SessionProvider } from '@/components/SessionProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}

// components/SessionProvider.tsx
'use client'

import { useEffect } from 'react'
import { sessionManager } from '@/lib/sessionManager'

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize session manager on mount
    sessionManager.validateSession()
  }, [])

  return <>{children}</>
}
```

### 4. Session Analytics

```typescript
// lib/sessionAnalytics.ts
export class SessionAnalytics {
  private sessionStart: Date
  private pageViews: string[] = []

  constructor() {
    this.sessionStart = new Date()
    this.trackPageView()
    this.setupListeners()
  }

  private setupListeners() {
    // Track page views
    if (typeof window !== 'undefined') {
      const originalPushState = history.pushState
      history.pushState = (...args) => {
        originalPushState.apply(history, args)
        this.trackPageView()
      }

      window.addEventListener('popstate', () => {
        this.trackPageView()
      })
    }
  }

  private trackPageView() {
    const path = window.location.pathname
    this.pageViews.push(path)

    // Send to analytics
    this.sendAnalytics('page_view', { path })
  }

  getSessionDuration(): number {
    return Date.now() - this.sessionStart.getTime()
  }

  getPageViewCount(): number {
    return this.pageViews.length
  }

  private sendAnalytics(event: string, data: any) {
    // Implementation depends on analytics provider
    console.log('Analytics:', event, data)
  }
}
```

## Features Implemented

- Automatic session refresh
- Multi-tab synchronization
- Session persistence
- Idle timeout detection
- Activity monitoring
- Session validation
- Analytics tracking
- Error recovery