import { getApiBaseUrl } from '$lib/api'
import { getAccessToken } from '$lib/auth/session-service'

export type RoomInfo = {
  id: string
  participantCount: number
}

const getAuthHeaders = (accessToken: string | null) =>
  accessToken
    ? {
        Authorization: `Bearer ${accessToken}`
      }
    : undefined

export async function fetchActiveRooms() {
  const accessToken = await getAccessToken()
  const response = await fetch(`${getApiBaseUrl()}/rooms`, {
    headers: getAuthHeaders(accessToken)
  })

  if (!response.ok) {
    throw new Error('Could not load rooms')
  }

  return (await response.json()) as RoomInfo[]
}

export async function createActiveRoomsEventSource() {
  const accessToken = await getAccessToken()
  const url = new URL(`${getApiBaseUrl()}/rooms/events`)
  if (accessToken) {
    url.searchParams.set('access_token', accessToken)
  }

  return new EventSource(url.toString())
}
