import type { Meeting } from '@/types'
import styles from './RecentMeetings.module.css'

interface RecentMeetingsProps {
  meetings: Meeting[]
  loading: boolean
}

/** Format ended_at + duration as "Aug 10 · 45 mins". */
function formatRecentMeta(meeting: Meeting): string {
  const dateStr = meeting.ended_at
    ? new Date(meeting.ended_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : meeting.scheduled_at
    ? new Date(meeting.scheduled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''

  const dur = meeting.duration_mins
  const durStr = dur < 60
    ? `${dur} min${dur !== 1 ? 's' : ''}`
    : `${Math.floor(dur / 60)}h${dur % 60 > 0 ? ` ${dur % 60}m` : ''}`

  return dateStr ? `${dateStr} · ${durStr}` : durStr
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonRow}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonSub}`} />
        </div>
      ))}
    </>
  )
}

export default function RecentMeetings({ meetings, loading }: RecentMeetingsProps) {
  const visible = meetings.slice(0, 4)

  return (
    <section className={styles.card} aria-label="Recent meetings">
      <h2 className={styles.header}>Recent Meetings</h2>

      {loading ? (
        <SkeletonRows />
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No recent meetings yet</p>
      ) : (
        visible.map((meeting) => (
          <div key={meeting.id} className={styles.row}>
            <div className={styles.rowLeft}>
              <span className={styles.title}>{meeting.title}</span>
              <span className={styles.meta}>{formatRecentMeta(meeting)}</span>
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
