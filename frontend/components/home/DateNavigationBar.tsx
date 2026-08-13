import { ChevronDown, ExternalLink, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import styles from './DateNavigationBar.module.css'

interface DateNavigationBarProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export default function DateNavigationBar({ selectedDate, onDateChange }: DateNavigationBarProps) {
  const isToday = () => {
    const today = new Date()
    return selectedDate.getFullYear() === today.getFullYear() &&
           selectedDate.getMonth() === today.getMonth() &&
           selectedDate.getDate() === today.getDate()
  }

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() - 1)
    onDateChange(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(selectedDate.getDate() + 1)
    onDateChange(newDate)
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const dateLabel = isToday() 
    ? `Today, ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className={styles.container} aria-label="Date navigation">
      {/* Top Row */}
      <div className={styles.topRow}>
        <div className={styles.dateDisplay}>
          <span className={styles.dateLabel}>{dateLabel}</span>
          <ChevronDown size={16} className={styles.iconSecondary} aria-hidden="true" />
        </div>
        <button type="button" className={styles.iconBtn} aria-label="Expand" disabled>
          <ExternalLink size={16} />
        </button>
      </div>

      {/* Bottom Row */}
      <div className={styles.bottomRow}>
        <div className={styles.navControls}>
          <button 
            type="button" 
            className={styles.todayBtn} 
            onClick={handleToday}
            aria-label="Go to today"
          >
            Today
          </button>
          <div className={styles.arrowGroup}>
            <button 
              type="button" 
              className={styles.arrowBtn} 
              onClick={handlePrevDay}
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              type="button" 
              className={styles.arrowBtn} 
              onClick={handleNextDay}
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <button type="button" className={styles.iconBtn} aria-label="More options" disabled>
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}
