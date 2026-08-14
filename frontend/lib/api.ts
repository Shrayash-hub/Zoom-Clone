/**
 * lib/api.ts — Centralized API client.
 * All fetch calls to the FastAPI backend live here.
 * Components and hooks MUST NOT make fetch calls directly.
 */

import type { HomeData, Meeting, Participant, User } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

/** Generic typed fetcher. Throws on non-ok responses. */
async function fetcher<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      ...init,
    })
  } catch (error) {
    throw new Error("Unable to connect to server. Please check your connection.")
  }

  if (!response.ok) {
    const errorText = await response.text()
    try {
      const parsed = JSON.parse(errorText)
      if (parsed.detail) {
        throw new Error(parsed.detail)
      }
    } catch (e) {
      // Not JSON or no detail, just throw the generic one
      if (e instanceof Error && e.message !== 'Unexpected token') {
        throw e // Re-throw the parsed detail error
      }
    }
    throw new Error(`API error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<T>
}

// ── Meeting endpoints ─────────────────────────────────────────────────────────

/** Fetch meetings filtered by type. */
export async function getMeetings(type: 'upcoming' | 'recent'): Promise<Meeting[]>
/** Fetch both upcoming and recent meetings in a single request. */
export async function getMeetings(): Promise<HomeData>
export async function getMeetings(type?: 'upcoming' | 'recent'): Promise<Meeting[] | HomeData> {
  if (type) {
    return fetcher<Meeting[]>(`/meetings?type=${type}`)
  }
  return fetcher<HomeData>('/meetings')
}

/** Fetch a single meeting by its raw meeting_id string. */
export async function getMeeting(meetingId: string): Promise<Meeting> {
  const cleanId = meetingId.replace(/\s+/g, '')
  return fetcher<Meeting>(`/meetings/${cleanId}`)
}

/** Create a new instant or scheduled meeting (Phase 3). */
export async function createMeeting(data: {
  title?: string
  meeting_type: 'instant' | 'scheduled'
  description?: string
  scheduled_at?: string
  duration_mins?: number
  passcode?: string
}): Promise<Meeting> {
  return fetcher<Meeting>('/meetings', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/** End a meeting (Phase 3). */
export async function endMeeting(meetingId: string): Promise<void> {
  await fetcher<void>(`/meetings/${meetingId}`, {
    method: 'DELETE',
  })
}

/** Join an existing meeting by registering as a participant (Phase 4). */
export async function joinMeeting(
  meetingId: string,
  displayName: string,
  passcode?: string
): Promise<{ success: boolean; meeting_id: string }> {
  const cleanId = meetingId.replace(/\s+/g, '')
  return fetcher<{ success: boolean; meeting_id: string }>(`/meetings/${cleanId}/join`, {
    method: 'POST',
    body: JSON.stringify({ display_name: displayName, passcode }),
  })
}

/** Schedule a new meeting (Phase 5). */
export async function scheduleMeeting(data: {
  title: string
  description?: string
  scheduled_at: string
  duration_mins: number
}): Promise<Meeting> {
  return createMeeting({
    ...data,
    meeting_type: 'scheduled',
  })
}

// ── Participants ─────────────────────────────────────────────────────────────

export async function getParticipants(meetingId: string): Promise<Participant[]> {
  return fetcher<Participant[]>(`/meetings/${meetingId}/participants`)
}

export async function removeParticipant(meetingId: string, participantId: number): Promise<void> {
  return fetcher<void>(`/meetings/${meetingId}/participants/${participantId}/remove`, {
    method: 'POST',
  })
}

/** Start or resume the PMI meeting (Phase 11). */
export async function startPmiMeeting(): Promise<Meeting> {
  return fetcher<Meeting>('/meetings/pmi/start', {
    method: 'POST',
  })
}

// ── User endpoints ────────────────────────────────────────────────────────────

/** Fetch the current user (Phase 6). */
export async function getUserMe(): Promise<User> {
  return fetcher<User>('/users/me')
}
