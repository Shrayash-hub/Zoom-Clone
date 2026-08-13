'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Copy, Pencil } from 'lucide-react'
import { getMeetings, getUserMe, startPmiMeeting } from '@/lib/api'
import type { Meeting, User } from '@/types'
import ComingSoonToast from '@/components/common/ComingSoonToast'
import styles from './meetings.module.css'

export default function MeetingsPage() {
  const router = useRouter()
  
  const [user, setUser] = useState<User | null>(null)
  const [upcoming, setUpcoming] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedId, setSelectedId] = useState<string | number>('pmi')
  const [showDetail, setShowDetail] = useState(false)
  const [copyTip, setCopyTip] = useState(false)
  const [comingSoonVisible, setComingSoonVisible] = useState(false)

  function showComingSoon() {
    setComingSoonVisible(true)
    setTimeout(() => setComingSoonVisible(false), 2000)
  }
  
  const fetchData = async () => {
    try {
      const [userData, meetingsData] = await Promise.all([
        getUserMe(),
        getMeetings('upcoming')
      ])
      setUser(userData)
      setUpcoming(meetingsData as Meeting[])
    } catch (err) {
      console.error('Failed to load meetings tab data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    document.title = 'Meetings \u2013 Zoom Workplace'
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const formatPMI = (pmi: string) => {
    if (!pmi) return ''
    const clean = pmi.replace(/\s+/g, '')
    return clean.replace(/(\d{3})(\d{3})(\d{3,4})/, '$1 $2 $3')
  }

  const handleCopyInvite = (meetingId: string, formattedId: string) => {
    const inviteText = `${user?.name || 'User'} is inviting you to a Zoom meeting.\nMeeting ID: ${formattedId}\nJoin link: ${window.location.origin}/join?id=${meetingId.replace(/\s+/g, '')}`
    navigator.clipboard.writeText(inviteText)
    setCopyTip(true)
    setTimeout(() => setCopyTip(false), 2000)
  }

  const handleStartPMI = async () => {
    try {
      const meeting = await startPmiMeeting()
      const cleanId = meeting.meeting_id.replace(/\s+/g, '')
      router.push(`/room/${cleanId}?name=Shrayash+Awasthi&host=true`)
    } catch (err) {
      console.error(err)
    }
  }

  const handleStartMeeting = (meetingId: string) => {
    router.push(`/room/${meetingId.replace(/\s+/g, '')}?name=Shrayash+Awasthi&host=true`)
  }

  const renderRightPanel = () => {
    if (selectedId === 'pmi') {
      const pmiFormatted = formatPMI(user?.personal_meeting_id || '')
      return (
        <div className={styles.detailContainer}>
          <button className={styles.backBtn} onClick={() => setShowDetail(false)}>
            ← Back
          </button>
          <h2 className={styles.detailTitle}>My Personal Meeting ID (PMI)</h2>
          <p className={styles.detailId}>{pmiFormatted}</p>
          
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={handleStartPMI}>
              Start
            </button>
            <button className={styles.btnSecondary} onClick={() => handleCopyInvite(user?.personal_meeting_id || '', pmiFormatted)}>
              <Copy size={14} />
              {copyTip ? 'Copied!' : 'Copy Invitation'}
            </button>
            <button className={styles.btnSecondary} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
              <Pencil size={14} />
              Edit
            </button>
          </div>
          
          <button className={styles.showInviteLink} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Show Meeting Invitation</button>
        </div>
      )
    }

    const meeting = upcoming.find(m => m.id === selectedId)
    if (!meeting) return null

    const formattedId = meeting.meeting_id
    const dateStr = meeting.scheduled_at 
      ? new Date(meeting.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : ''
    const timeStr = meeting.scheduled_at
      ? new Date(meeting.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      : ''
      
    return (
      <div className={styles.detailContainer}>
        <button className={styles.backBtn} onClick={() => setShowDetail(false)}>
          ← Back
        </button>
        <h2 className={styles.detailTitle}>{meeting.title}</h2>
        <p className={styles.detailId}>{formattedId}</p>
        
        <div className={styles.detailMeta}>
          <span className={styles.metaText}>{dateStr} &middot; {timeStr}</span>
          <span className={styles.metaText}>{meeting.duration_mins} minutes</span>
        </div>
        
        <div className={styles.actions}>
          <button className={styles.btnPrimary} onClick={() => handleStartMeeting(meeting.meeting_id)}>
            Start
          </button>
          <button className={styles.btnSecondary} onClick={() => handleCopyInvite(meeting.meeting_id, formattedId)}>
            <Copy size={14} />
            {copyTip ? 'Copied!' : 'Copy Invitation'}
          </button>
          <button className={styles.btnSecondary} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            <Pencil size={14} />
            Edit
          </button>
        </div>
        
        <button className={styles.showInviteLink} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Show Meeting Invitation</button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className={styles.page} style={{ padding: '24px' }}>
        <div style={{ width: '280px', height: '100%', background: 'var(--color-border)', borderRadius: 'var(--radius-md)', animation: 'skeleton-pulse var(--duration-base) ease-in-out infinite' }} />
        <div style={{ flex: 1, marginLeft: '24px', height: '100%', background: 'var(--color-border)', borderRadius: 'var(--radius-md)', animation: 'skeleton-pulse var(--duration-base) ease-in-out infinite' }} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.leftPanel} ${showDetail ? styles.panelHidden : styles.panelVisible}`}>
        <div className={styles.leftHeader}>
          <button 
            className={`${styles.refreshBtn} ${refreshing ? styles.refreshing : ''}`} 
            onClick={handleRefresh}
            title="Refresh"
            aria-label="Refresh meetings"
          >
            <RefreshCw size={16} />
          </button>
          Upcoming
        </div>
        
        <div className={styles.list}>
          {/* PMI Card */}
          <div 
            className={`${styles.pmiCard} ${selectedId === 'pmi' ? styles.selected : styles.unselected}`}
            onClick={() => { setSelectedId('pmi'); setShowDetail(true); }}
          >
            <div className={styles.pmiTitle}>{formatPMI(user?.personal_meeting_id || '')}</div>
            <div className={styles.pmiSubtitle}>My Personal Meeting ID (PMI)</div>
          </div>
          
          {/* Upcoming Meetings List */}
          {upcoming.length === 0 ? (
            <div className={styles.emptyState}>No upcoming meetings</div>
          ) : (
            upcoming.map(m => {
              const timeStr = m.scheduled_at
                ? new Date(m.scheduled_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                : ''
              return (
                <div 
                  key={m.id}
                  className={`${styles.meetingRow} ${selectedId === m.id ? styles.selected : ''}`}
                  onClick={() => { setSelectedId(m.id); setShowDetail(true); }}
                >
                  <div className={styles.rowTitle}>{m.title}</div>
                  <div className={styles.rowTime}>{timeStr}</div>
                </div>
              )
            })
          )}
        </div>
        
        <div className={styles.addCalendar}>
          <a href="#" className={styles.addCalendarLink} onClick={(e) => { e.preventDefault(); showComingSoon() }} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>＋ Add a calendar</a>
        </div>
      </div>
      
      <div className={`${styles.rightPanel} ${!showDetail ? styles.panelHidden : styles.panelVisible}`}>
        {renderRightPanel()}
      </div>
      
      <ComingSoonToast visible={comingSoonVisible} />
    </div>
  )
}
