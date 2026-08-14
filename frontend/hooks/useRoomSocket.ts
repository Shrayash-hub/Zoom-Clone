import { useState, useEffect, useRef, useCallback } from 'react'

export interface SocketParticipant {
  display_name: string
  is_host: boolean
  muted: boolean
  joined_at: string
}

interface UseRoomSocketReturn {
  participants: SocketParticipant[]
  connected: boolean
  isMuted: boolean        // true when host broadcasts mute_all to this client
  muteAll: () => void     // sends mute_all command to server (host only)
  unmuteAll: () => void   // sends unmute_all command to server (host only)
  muteParticipant: (displayName: string) => void
  unmuteParticipant: (displayName: string) => void
  wasRemoved: boolean     // true when this participant is removed by host
  removeParticipant: (displayName: string) => void
}

export function useRoomSocket(
  meetingId: string,        // raw 9-digit, no spaces
  displayName: string,
  isHost: boolean
): UseRoomSocketReturn {
  const [participants, setParticipants] = useState<SocketParticipant[]>([])
  const [connected, setConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [wasRemoved, setWasRemoved] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!meetingId || !displayName) return

    const wsBase = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
    const url = `${wsBase}/ws/room/${meetingId}?display_name=${encodeURIComponent(displayName)}&is_host=${isHost}`

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'participants_update') {
        setParticipants(data.participants)
      } else if (data.type === 'mute_all') {
        setIsMuted(true)
      } else if (data.type === 'unmute_all') {
        setIsMuted(false)
      } else if (data.type === 'muted_by_host') {
        setIsMuted(true)
      } else if (data.type === 'unmuted_by_host') {
        setIsMuted(false)
      } else if (data.type === 'removed') {
        setWasRemoved(true)
      }
    }

    ws.onclose = () => setConnected(false)

    ws.onerror = () => setConnected(false)

    // Keepalive ping every 20 seconds
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send('ping')
      }
    }, 20000)

    return () => {
      clearInterval(ping)
      ws.close()
    }
  }, [meetingId, displayName, isHost])

  // muteAll function — host sends command to server
  const muteAll = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mute_all' }))
    }
  }, [])

  const unmuteAll = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unmute_all' }))
    }
  }, [])

  const muteParticipant = useCallback((displayName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'mute_participant', display_name: displayName }))
    }
  }, [])

  const unmuteParticipant = useCallback((displayName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unmute_participant', display_name: displayName }))
    }
  }, [])

  const removeParticipant = useCallback((displayName: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'remove_participant', display_name: displayName }))
    }
  }, [])

  return { participants, connected, isMuted, muteAll, unmuteAll, muteParticipant, unmuteParticipant, wasRemoved, removeParticipant }
}
