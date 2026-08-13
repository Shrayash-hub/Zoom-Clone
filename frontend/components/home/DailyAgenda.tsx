import { useRouter } from 'next/navigation'
import { Umbrella, ChevronRight } from 'lucide-react'
import type { Meeting } from '@/types'
import styles from './DailyAgenda.module.css'

interface DailyAgendaProps {
  selectedDate: Date
  upcoming: Meeting[]
  recent: Meeting[]
  loading: boolean
}

/** Format a scheduled_at ISO string as "3:00 PM". */
function formatTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
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

export default function DailyAgenda({ selectedDate, upcoming, recent, loading }: DailyAgendaProps) {
  const router = useRouter()

  // Filter meetings for selectedDate
  const allMeetings = [...upcoming, ...recent]
  
  // Deduplicate just in case a meeting appears in both
  const uniqueMeetings = Array.from(new Map(allMeetings.map(m => [m.id, m])).values())

  const filteredMeetings = uniqueMeetings.filter((meeting) => {
    if (!meeting.scheduled_at) return false
    const d = new Date(meeting.scheduled_at)
    return (
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate()
    )
  })

  // Sort by time
  filteredMeetings.sort((a, b) => {
    if (!a.scheduled_at || !b.scheduled_at) return 0
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
  })

  return (
    <div className={styles.container} aria-label="Daily agenda">
      {loading ? (
        <SkeletonRows />
      ) : filteredMeetings.length === 0 ? (
        <div className={styles.empty}>
          <Umbrella size={48} className={styles.emptyIcon} strokeWidth={1.5} aria-hidden="true" />
          <p>No meetings scheduled.</p>
        </div>
      ) : (
        <div className={styles.meetingList}>
          {filteredMeetings.map((meeting) => (
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
                  {meeting.scheduled_at ? formatTime(meeting.scheduled_at) : '—'}
                </span>
              </div>
              {meeting.participant_count > 0 && (
                <span className={styles.badge}>
                  {meeting.participant_count} participant{meeting.participant_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        <button type="button" className={styles.recordingsLink} disabled>
          Open recordings
          <ChevronRight size={14} className={styles.footerChevron} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
