/**
 * Shared TypeScript types for the Zoom Clone app.
 * Keep in sync with backend Pydantic schemas.
 */

export type MeetingType = 'instant' | 'scheduled' | 'personal'
export type MeetingStatus = 'waiting' | 'active' | 'ended'

export interface User {
  id: number
  name: string
  email: string
  avatar_url?: string
  personal_meeting_id: string
}

export interface Meeting {
  id: number
  meeting_id: string          // formatted: "XXX XXX XXX"
  title: string
  description?: string
  host_id: number
  meeting_type: MeetingType
  status: MeetingStatus
  scheduled_at?: string
  duration_mins: number
  invite_link: string
  passcode?: string
  created_at: string
  ended_at?: string
  participant_count: number
}

export interface Participant {
  id: number
  meeting_id: string
  display_name: string
  joined_at: string
  is_host: boolean
}

export interface HomeData {
  upcoming: Meeting[]
  recent: Meeting[]
}
