'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { getMeeting, joinMeeting } from '@/lib/api'
import styles from './join.module.css'

function JoinContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [step, setStep] = useState<1 | 2>(1)
  const [meetingId, setMeetingId] = useState('')
  const [displayName, setDisplayName] = useState('Shrayash Awasthi')
  const [passcode, setPasscode] = useState('')
  const [meetingRequiresPasscode, setMeetingRequiresPasscode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [meetingTitle, setMeetingTitle] = useState('')

  // Format ID to XXX XXX XXXX
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 10) // Allow up to 10 digits
    if (val.length > 3 && val.length <= 6) {
      val = `${val.slice(0, 3)} ${val.slice(3)}`
    } else if (val.length > 6) {
      val = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`
    }
    setMeetingId(val)
    setError(null)
  }

  // Effect for document title
  useEffect(() => {
    document.title = 'Join a Meeting – Zoom Workplace'
  }, [])

  // Effect for ?id= query param
  useEffect(() => {
    const idParam = searchParams.get('id')
    if (idParam) {
      // Auto-format the ID for display
      let val = idParam.replace(/\D/g, '').substring(0, 10)
      if (val.length > 3 && val.length <= 6) {
        val = `${val.slice(0, 3)} ${val.slice(3)}`
      } else if (val.length > 6) {
        val = `${val.slice(0, 3)} ${val.slice(3, 6)} ${val.slice(6)}`
      }
      setMeetingId(val || idParam)
      validateMeeting(idParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const validateMeeting = async (idToValidate: string) => {
    const stripped = idToValidate.replace(/\s+/g, '')
    if (stripped.length < 9) return

    setLoading(true)
    setError(null)
    try {
      const meeting = await getMeeting(stripped)
      setMeetingTitle(meeting.title)
      setMeetingRequiresPasscode(!!meeting.passcode)
      setStep(2)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Meeting not found')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!displayName.trim()) return

    // Validate passcode presence if required
    if (meetingRequiresPasscode && !passcode.trim()) {
      setError('A passcode is required to join this meeting.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await joinMeeting(
        meetingId,
        displayName,
        meetingRequiresPasscode ? passcode.trim() : undefined
      )
      if (res.success) {
        router.push(`/room/${res.meeting_id}?name=${encodeURIComponent(displayName)}&host=false`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to join meeting'
      if (message.includes('Incorrect passcode')) {
        setError('Incorrect passcode. Please try again.')
      } else if (message.includes('requires a passcode')) {
        setError('A passcode is required to join this meeting.')
      } else {
        setError(message)
      }
      setLoading(false) // Only stop loading if error, otherwise let it navigate
    }
  }

  const digitsOnly = meetingId.replace(/\s+/g, '')
  const isValidLength = digitsOnly.length >= 9 && digitsOnly.length <= 10

  if (step === 1) {
    return (
      <div className={styles.card}>
        <h1 className={styles.title}>Join a Meeting</h1>
        <p className={styles.subtitle}>Enter your Meeting ID</p>

        <div className={styles.form}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={meetingId}
              onChange={handleIdChange}
              placeholder="Meeting ID (e.g. 554 269 9869)"
              className={styles.input}
              disabled={loading}
              autoFocus
            />
            {error && <span className={styles.error}>{error}</span>}
          </div>

          <button
            type="button"
            className={styles.button}
            disabled={!isValidLength || loading}
            onClick={() => validateMeeting(meetingId)}
          >
            {loading ? 'Checking...' : 'Join'}
          </button>

          <Link href="/" className={styles.cancelLink}>
            Cancel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>What&apos;s your name?</h1>
      <p className={styles.subtitle}>Joining: {meetingTitle}</p>

      <div className={styles.form}>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value.substring(0, 50))
              setError(null)
            }}
            placeholder="Your Name"
            className={`${styles.input} ${styles.nameInput}`}
            disabled={loading}
            autoFocus
          />
        </div>

        {meetingRequiresPasscode && (
          <div className={styles.inputWrapper}>
            <label className={styles.passcodeLabel}>Passcode</label>
            <input
              type="password"
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value)
                setError(null)
              }}
              placeholder="Meeting passcode"
              className={`${styles.input} ${styles.nameInput}`}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
        )}

        {error && <span className={styles.error}>{error}</span>}

        <button
          type="button"
          className={styles.button}
          disabled={!displayName.trim() || loading}
          onClick={handleJoin}
        >
          {loading ? 'Joining...' : 'Join Meeting'}
        </button>

        <button
          type="button"
          className={styles.backLink}
          onClick={() => {
            setStep(1)
            setError(null)
            setPasscode('')
          }}
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<div className={styles.card}>Loading...</div>}>
        <JoinContent />
      </Suspense>
    </main>
  )
}
