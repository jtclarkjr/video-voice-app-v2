import type { AuthUser } from '@jtclarkjr/supabase-ts-rest'

export type User = AuthUser

export type Session = {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}

export type SessionPayload = Omit<Session, 'user'> & {
  user?: User | null
}

export type SessionListener = (session: Session | null) => void
