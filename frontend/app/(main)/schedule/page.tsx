"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { scheduleMeeting } from '@/lib/api'
import styles from './schedule.module.css'

function getNearestHalfHour() {
  const now = new Date()
  if (now.getMinutes() > 30) {
    now.setHours(now.getHours() + 1)
    now.setMinutes(0)
  } else if (now.getMinutes() > 0) {
    now.setMinutes(30)
  }
  // format to HH:MM (local time)
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export default function SchedulePage() {
  const router = useRouter()
  
  const [topic, setTopic] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [time, setTime] = useState(getNearestHalfHour())
  const [duration, setDuration] = useState(60)
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ topic?: string; datetime?: string; api?: string }>({})

  useEffect(() => {
    document.title = 'Schedule a Meeting \u2013 Zoom Workplace'
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    
    // Validate
    let hasError = false
    const newErrors: typeof errors = {}
    
    if (!topic.trim()) {
      newErrors.topic = 'Topic is required'
      hasError = true
    }
    
    const scheduledDateTime = new Date(`${date}T${time}`)
    if (scheduledDateTime <= new Date()) {
      newErrors.datetime = 'Please select a future date and time'
      hasError = true
    }
    
    if (hasError) {
      setErrors(newErrors)
      return
    }
    
    // Submit
    setLoading(true)
    try {
      await scheduleMeeting({
        title: topic,
        description,
        scheduled_at: scheduledDateTime.toISOString(),
        duration_mins: duration
      })
      router.push('/')
    } catch (err: any) {
      setErrors({ api: err.message || 'Failed to schedule meeting' })
      setLoading(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Schedule a Meeting</h1>
          <p className={styles.subtitle}>Fill in the details below to schedule your meeting</p>
        </div>
        
        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Topic */}
          <div className={styles.field}>
            <label className={styles.label}>Topic</label>
            <input
              type="text"
              className={styles.input}
              placeholder="Meeting topic"
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
            {errors.topic && <span className={styles.errorText}>{errors.topic}</span>}
          </div>
          
          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label}>Description (optional)</label>
            <textarea
              className={styles.textarea}
              placeholder="Meeting description"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          
          {/* Date & Time */}
          <div className={styles.field}>
            <label className={styles.label}>When</label>
            <div className={styles.datetimeRow}>
              <div>
                <input
                  type="date"
                  className={styles.input}
                  min={todayStr}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div>
                <input
                  type="time"
                  className={styles.input}
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>
            {errors.datetime && <span className={styles.errorText}>{errors.datetime}</span>}
          </div>
          
          {/* Duration */}
          <div className={styles.field}>
            <label className={styles.label}>Duration</label>
            <select
              className={styles.select}
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
            >
              <option value={30}>30 min</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
              <option value={180}>3 hours</option>
            </select>
          </div>
          
          {/* Meeting ID */}
          <div className={styles.field}>
            <label className={styles.label}>Meeting ID</label>
            <div className={styles.staticText}>Will be generated automatically</div>
          </div>
          
          {/* Form Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={() => router.push('/')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
          {errors.api && <div className={styles.errorText} style={{ textAlign: 'right' }}>{errors.api}</div>}
        </form>
      </div>
    </div>
  )
}
