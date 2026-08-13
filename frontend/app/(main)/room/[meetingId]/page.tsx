'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { Mic, MicOff, Video, VideoOff, Shield, Users, MessageSquare, Smile, X, Hourglass, Info, ShieldCheck, LayoutGrid, ChevronUp, AlertTriangle, ArrowUpSquare, Sparkles, MoreHorizontal } from 'lucide-react'
import { getMeeting, endMeeting } from '@/lib/api'
import type { Meeting } from '@/types'
import { useRoomSocket } from '@/hooks/useRoomSocket'
import InviteModal from '@/components/modals/InviteModal'
import ComingSoonToast from '@/components/common/ComingSoonToast'
import styles from './room.module.css'

export default function MeetingRoomPage() {
  const router = useRouter()
  const params = useParams()
  const meetingId = params.meetingId as string
  const searchParams = useSearchParams()
  const displayName = searchParams.get('name') || 'Shrayash Awasthi'
  const isHost = searchParams.get('host') === 'true'

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)

  // Controls state
  const [isMutedLocal, setIsMutedLocal] = useState(false)
  const [isVideoStopped, setIsVideoStopped] = useState(false)

  // Mute All button feedback state
  const [muteAllLabel, setMuteAllLabel] = useState<'Mute All' | 'Muted'>('Mute All')

  // Participants state
  const { participants, connected, isMuted, muteAll, wasRemoved, removeParticipant } = useRoomSocket(meetingId, displayName, isHost)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const [errorMsg, setErrorMsg] = useState('')
  const [comingSoonVisible, setComingSoonVisible] = useState(false)

  function showComingSoon() {
    setComingSoonVisible(true)
    setTimeout(() => setComingSoonVisible(false), 2000)
  }

  useEffect(() => {
    document.title = 'Zoom Meeting'
  }, [])

  useEffect(() => {
    if (wasRemoved) {
      setErrorMsg('You have been removed from the meeting by the host.')
      setTimeout(() => router.replace('/'), 1500)
    }
  }, [wasRemoved, router])

  // Sync isMuted from socket — when host broadcasts mute_all, force local mute
  useEffect(() => {
    if (isMuted) setIsMutedLocal(true)
  }, [isMuted])

  useEffect(() => {
    async function loadMeeting() {
      try {
        const m = await getMeeting(meetingId)
        if (m.status === 'ended') {
          setErrorMsg('This meeting has ended. Redirecting...')
          setTimeout(() => router.replace('/'), 1000)
        } else {
          setMeeting(m)
        }
      } catch (err) {
        setErrorMsg('This meeting has ended. Redirecting...')
        setTimeout(() => router.replace('/'), 1000)
      } finally {
        setLoading(false)
      }
    }

    if (meetingId) {
      loadMeeting()
    }
  }, [meetingId, router])

  // Timer interval
  useEffect(() => {
    if (loading || !meeting) return
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [loading, meeting])

  // Poll for meeting status if waiting (non-host)
  useEffect(() => {
    if (isHost || !meeting || meeting.status !== 'waiting') return
    const timer = setInterval(async () => {
      try {
        const m = await getMeeting(meetingId)
        if (m.status !== meeting.status) {
          setMeeting(m)
        }
      } catch (e) {
        // ignore errors during polling
      }
    }, 10000)
    return () => clearInterval(timer)
  }, [meeting, meetingId, isHost])

  async function handleLeave() {
    if (!meeting) return
    try {
      await endMeeting(meeting.meeting_id)
    } catch (err) {
      console.error('Failed to end meeting', err)
    } finally {
      router.replace('/')
    }
  }



  const handleMuteAll = useCallback(() => {
    muteAll()
    setIsMutedLocal(true) // Host mutes themselves too
    setMuteAllLabel('Muted')
    setTimeout(() => setMuteAllLabel('Mute All'), 2000)
  }, [muteAll])

  function formatTimer(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60

    const mStr = m.toString().padStart(2, '0')
    const sStr = s.toString().padStart(2, '0')

    if (h > 0) {
      const hStr = h.toString().padStart(2, '0')
      return `${hStr}:${mStr}:${sStr}`
    }
    return `${mStr}:${sStr}`
  }

  if (loading) {
    return (
      <div
        className={styles.roomLayout}
        style={{ animation: 'skeleton-pulse var(--duration-base) ease-in-out infinite' }}
      />
    )
  }

  if (errorMsg) {
    return (
      <div
        className={styles.roomLayout}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px' }}
      >
        {errorMsg}
      </div>
    )
  }

  if (!meeting) {
    return null
  }

  // Waiting for host screen
  if (!isHost && meeting.status === 'waiting') {
    return (
      <div className={styles.roomLayout}>
        <div className={styles.topBar}>
          <div className={styles.titleWrapper} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={styles.title}>Zoom Workplace</div>
          </div>
        </div>
        <div className={styles.waitingScreen}>
          <Hourglass size={48} className={styles.waitingIcon} />
          <h2 className={styles.waitingHeading}>Please wait, the meeting host will let you in soon.</h2>
          <p className={styles.waitingSubtext}>{meeting.title}</p>
          <div className={styles.waitingActions}>
            <button className={styles.leaveBtn} onClick={handleLeave}>Leave</button>
          </div>
        </div>
      </div>
    )
  }

  const host = participants.find(p => p.is_host)
  const hostName = host?.display_name || (isHost ? displayName : 'Host')

  return (
    <div className={styles.roomLayout}>
      {/* Top bar */}
      <div className={styles.topBar}>
        {/* Left side */}
        <div 
          className={styles.titleWrapper} 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
          onClick={() => setShowInvite(true)}
          title="Meeting Information (Invite)"
        >
          <Info size={16} color="var(--color-text-secondary)" />
          <div className={styles.title}>{hostName}'s Zoom Meeting</div>
        </div>
        
        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className={styles.inviteBtn} onClick={() => setShowInvite(true)}>
            Invite
          </button>
          <ShieldCheck size={18} color="var(--color-success)" />
          <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--color-border)' }} />
          <LayoutGrid size={18} color="var(--color-text-secondary)" />
          <div className={styles.zoomBadge}>zm</div>
        </div>
      </div>

      {/* Main area */}
      <div className={styles.mainArea}>
        <div className={styles.videoCard}>
          <div className={styles.avatar}>SA</div>
          <div className={styles.userName}>Shrayash Awasthi</div>
          <div className={styles.waitingText}>Waiting for others to join...</div>
        </div>

        {isParticipantsOpen && (
          <div className={styles.participantsPanel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Participants ({participants.length})</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isHost && (
                  <button
                    className={`${styles.muteAllBtn} ${muteAllLabel === 'Muted' ? styles.muted : ''}`}
                    onClick={handleMuteAll}
                  >
                    {muteAllLabel}
                  </button>
                )}
                <button className={styles.closeBtn} onClick={() => setIsParticipantsOpen(false)}>
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={styles.panelContent}>
              {participants.length === 0 ? (
                <div className={styles.emptyPanelText}>No participants yet</div>
              ) : (
                participants.map((p, idx) => (
                  <div key={idx} className={styles.participantRow} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                    <div className={styles.pAvatar} style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'white', fontWeight: 600 }}>
                      {p.display_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className={styles.pName} title={p.display_name} style={{ color: 'white', fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.display_name}
                    </div>
                    {p.is_host && <div className={styles.hostBadge} style={{ fontSize: '11px', backgroundColor: '#333', color: '#ccc', padding: '2px 6px', borderRadius: '12px' }}>Host</div>}
                    {isHost && !p.is_host && p.display_name !== displayName && (
                      <button
                        onClick={() => removeParticipant(p.display_name)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ff4d4f',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '4px'
                        }}
                        title="Remove Participant"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsGroup}>
          <button className={styles.controlBtn} onClick={() => setIsMutedLocal(!isMutedLocal)}>
            <div className={styles.controlIconWrapper}>
              {isMutedLocal ? <MicOff size={20} color="#ff4d4f" /> : <Mic size={20} />}
            </div>
            <span className={styles.controlLabel}>{isMutedLocal ? 'Unmute' : 'Mute'}</span>
          </button>
          <button className={styles.controlBtn} onClick={() => setIsVideoStopped(!isVideoStopped)}>
            <div className={styles.controlIconWrapper}>
              {isVideoStopped ? <VideoOff size={20} color="#ff4d4f" /> : <Video size={20} />}
              <AlertTriangle size={12} color="var(--color-danger)" className={styles.alertBadge} />
              <ChevronUp size={12} className={styles.caretBadge} />
            </div>
            <span className={styles.controlLabel}>{isVideoStopped ? 'Start Video' : 'Stop Video'}</span>
          </button>
        </div>

        <div className={styles.centerGroup}>
          <button
            className={`${styles.controlBtn} ${isParticipantsOpen ? styles.active : ''}`}
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
          >
            <div className={styles.controlIconWrapper}>
              <Users size={20} />
              <span className={styles.numericBadge}>{participants.length}</span>
              <ChevronUp size={12} className={styles.caretBadge} />
            </div>
            <span className={styles.controlLabel}>Participants</span>
          </button>
          <button className={styles.controlBtn} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <div className={styles.controlIconWrapper}>
              <MessageSquare size={20} />
            </div>
            <span className={styles.controlLabel}>Chat</span>
          </button>
          <button className={styles.controlBtn} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <div className={styles.controlIconWrapper}>
              <Smile size={20} />
            </div>
            <span className={styles.controlLabel}>React</span>
          </button>
          <button className={styles.controlBtn} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <div className={styles.controlIconWrapper}>
              <ArrowUpSquare size={20} color="var(--color-success)" />
              <ChevronUp size={12} className={styles.caretBadgeShare} />
            </div>
            <span className={styles.controlLabel}>Share</span>
          </button>
          <button className={styles.controlBtn} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <div className={styles.controlIconWrapper}>
              <Shield size={20} />
            </div>
            <span className={styles.controlLabel}>Host tools</span>
          </button>
          <button className={styles.controlBtn} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <div className={styles.controlIconWrapper}>
              <Sparkles size={20} />
            </div>
            <span className={styles.controlLabel}>Zoom AI</span>
          </button>
          <button className={styles.controlBtn}>
            <div className={styles.controlIconWrapper}>
              <MoreHorizontal size={20} />
            </div>
            <span className={styles.controlLabel}>More</span>
          </button>
        </div>

        <div className={styles.controlsGroup}>
          <button className={styles.endBtn} onClick={handleLeave}>
            <div className={styles.endIconCircle}>
              <X size={14} strokeWidth={3} />
            </div>
            <span className={styles.controlLabel}>End</span>
          </button>
        </div>
      </div>

      {showInvite && (
        <InviteModal
          meetingId={meeting.meeting_id}
          inviteLink={meeting.invite_link}
          passcode={meeting.passcode}
          onClose={() => setShowInvite(false)}
        />
      )}
      
      <ComingSoonToast visible={comingSoonVisible} />
    </div>
  )
}
