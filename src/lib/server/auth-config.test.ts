import { beforeEach, describe, expect, it, vi } from 'vite-plus/test'

const envMock = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>
}))

vi.mock('$env/dynamic/private', () => envMock)

const setEnv = (nextEnv: Record<string, string | undefined>) => {
  for (const key of Object.keys(envMock.env)) {
    delete envMock.env[key]
  }

  Object.assign(envMock.env, nextEnv)
}

describe('auth config', () => {
  beforeEach(() => {
    setEnv({})
  })

  it('enables email signup when email auth and email signup are enabled', async () => {
    setEnv({
      ENABLE_EMAIL_AUTH: 'true',
      ENABLE_EMAIL_SIGNUP: 'true',
      SUPABASE_URL: 'https://project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key'
    })

    const { getAuthConfig } = await import('$lib/server/auth-config')

    expect(getAuthConfig().providers.email).toBe(true)
    expect(getAuthConfig().emailSignUpEnabled).toBe(true)
  })

  it('disables email signup when the email signup flag is false', async () => {
    setEnv({
      ENABLE_EMAIL_AUTH: 'true',
      ENABLE_EMAIL_SIGNUP: 'false',
      SUPABASE_URL: 'https://project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key'
    })

    const { getAuthConfig } = await import('$lib/server/auth-config')

    expect(getAuthConfig().providers.email).toBe(true)
    expect(getAuthConfig().emailSignUpEnabled).toBe(false)
  })

  it('disables email signup when email auth is disabled', async () => {
    setEnv({
      ENABLE_EMAIL_AUTH: 'false',
      ENABLE_EMAIL_SIGNUP: 'true',
      SUPABASE_URL: 'https://project.supabase.co',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'publishable-key'
    })

    const { getAuthConfig } = await import('$lib/server/auth-config')

    expect(getAuthConfig().providers.email).toBe(false)
    expect(getAuthConfig().emailSignUpEnabled).toBe(false)
  })
})
