import { useRouter } from 'next/navigation'
import { Calendar } from 'lucide-react'
import type { Meeting } from '@/types'
import styles from './UpcomingMeetings.module.css'

interface UpcomingMeetingsProps {
  meetings: Meeting[]
  loading: boolean
}

/** Format a scheduled_at ISO string as "Today, 3:00 PM" or "Mon, Aug 14 · 3:00 PM". */
function formatScheduledAt(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  if (isToday) {
    return `Today, ${timeStr}`
  }

  const dayStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return `${dayStr} · ${timeStr}`
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonSub}`} />
        </div>
      ))}
    </>
  )
}

export default function UpcomingMeetings({ meetings, loading }: UpcomingMeetingsProps) {
  const router = useRouter()

  return (
    <section className={styles.card} aria-label="Upcoming meetings">
      <h2 className={styles.header}>Upcoming Meetings</h2>

      {loading ? (
        <SkeletonRows />
      ) : meetings.length === 0 ? (
        <div className={styles.empty}>
          <Calendar size={32} color="var(--color-text-secondary)" />
          <p>No upcoming meetings</p>
        </div>
      ) : (
        meetings.map((meeting) => (
          <div
            key={meeting.id}
            className={styles.row}
            role="button"
            tabIndex={0}
            aria-label={`View meeting: ${meeting.title}`}
            onClick={() => router.push('/meetings')}
            onKeyDown={(e) => e.key === 'Enter' && router.push('/meetings')}
          >
            <div className={styles.rowLeft}>
              <span className={styles.title}>{meeting.title}</span>
              <span className={styles.time}>
                {meeting.scheduled_at ? formatScheduledAt(meeting.scheduled_at) : '—'}
              </span>
            </div>
            {meeting.participant_count > 0 && (
              <span className={styles.badge}>
                {meeting.participant_count} participant{meeting.participant_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        ))
      )}
    </section>
  )
}
