import { VideoOff, Plus, Calendar } from 'lucide-react'
import styles from './ActionButtons.module.css'

interface ActionButtonsProps {
  currentDate?: Date | null
  onNewMeeting: () => void
  onJoin: () => void
  onSchedule: () => void
}

export default function ActionButtons({ currentDate, onNewMeeting, onJoin, onSchedule }: ActionButtonsProps) {
  return (
    <div className={styles.row} aria-label="Meeting actions">

      {/* New Meeting */}
      <button
        id="action-new-meeting"
        className={styles.item}
        onClick={onNewMeeting}
        type="button"
        aria-label="Start a new meeting"
      >
        <span className={`${styles.iconBox} ${styles.iconBoxNew}`}>
          <VideoOff size={24} color="white" aria-hidden="true" />
        </span>
        <span className={styles.label}>
          New meeting
          <span className={styles.chevron} aria-hidden="true">▾</span>
        </span>
      </button>

      {/* Join */}
      <button
        id="action-join"
        className={styles.item}
        onClick={onJoin}
        type="button"
        aria-label="Join a meeting"
      >
        <span className={`${styles.iconBox} ${styles.iconBoxJoin}`}>
          <Plus size={24} color="white" aria-hidden="true" />
        </span>
        <span className={styles.label}>Join</span>
      </button>

      {/* Schedule */}
      <button
        id="action-schedule"
        className={styles.item}
        onClick={onSchedule}
        type="button"
        aria-label="Schedule a meeting"
      >
        <span className={`${styles.iconBox} ${styles.iconBoxSchedule}`}>
          <Calendar size={24} color="white" aria-hidden="true" />
          {currentDate && (
            <span className={styles.calendarDateOverlay} aria-hidden="true">
              {currentDate.getDate()}
            </span>
          )}
        </span>
        <span className={styles.label}>Schedule</span>
      </button>

    </div>
  )
}
