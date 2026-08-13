'use client'

import { useState, useEffect } from 'react'
import { Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ActionButtons from '@/components/home/ActionButtons'
import DateNavigationBar from '@/components/home/DateNavigationBar'
import DailyAgenda from '@/components/home/DailyAgenda'
import NewMeetingModal from '@/components/modals/NewMeetingModal'
import ComingSoonToast from '@/components/common/ComingSoonToast'
import { useHomeData } from '@/hooks/useHomeData'
import styles from './page.module.css'

export default function HomePage() {
  const [now, setNow] = useState<Date | null>(null)
  const [showNewMeeting, setShowNewMeeting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { upcoming, recent, loading, error } = useHomeData()
  const router = useRouter()
  const [comingSoonVisible, setComingSoonVisible] = useState(false)

  function showComingSoon() {
    setComingSoonVisible(true)
    setTimeout(() => setComingSoonVisible(false), 2000)
  }

  // Live clock — initialised client-side only to avoid SSR hydration mismatch
  useEffect(() => {
    document.title = 'Zoom Workplace'
    setNow(new Date())
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = now
    ? now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : ''

  const dateStr = now
    ? now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    : ''

  return (
    <div id="home-page" className={styles.page}>

      {/* Section 1: Live clock + date */}
      <section className={styles.clockSection} aria-label="Current time and date">
        <time className={styles.clock} dateTime={now?.toISOString()}>
          {timeStr}
        </time>
        <p className={styles.date}>{dateStr}</p>
      </section>

      {/* Section 2: Action buttons */}
      <ActionButtons
        currentDate={now}
        onNewMeeting={() => setShowNewMeeting(true)}
        onJoin={() => router.push('/join')}
        onSchedule={() => router.push('/schedule')}
      />

      {/* Inline error banner (below action buttons, above cards) */}
      {error && (
        <p className={styles.error} role="alert" aria-live="polite">
          Could not load meetings. Retrying...
        </p>
      )}

      {/* Static Calendar Banner */}
      <aside className={styles.infoBanner} role="note" aria-label="Calendar Connection Info">
        <Info size={20} className={styles.infoIcon} />
        <p className={styles.infoText}>
          You haven't connected your calendar yet. <a href="#" onClick={(e) => { e.preventDefault(); showComingSoon() }} className={styles.infoLink} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }}>Connect now</a> to manage all your meetings and events in one place.
        </p>
      </aside>

      {/* Sections 3 & 4: Agenda Card (Date Nav + Daily Agenda) */}
      <div className={styles.agendaCard}>
        <DateNavigationBar 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
        />
        <DailyAgenda 
          selectedDate={selectedDate} 
          upcoming={upcoming} 
          recent={recent} 
          loading={loading} 
        />
      </div>

      {/* Stub New Meeting modal */}
      {showNewMeeting && (
        <NewMeetingModal onClose={() => setShowNewMeeting(false)} />
      )}
      
      <ComingSoonToast visible={comingSoonVisible} />

    </div>
  )
}
