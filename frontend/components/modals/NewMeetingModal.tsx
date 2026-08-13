'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMeeting } from '@/lib/api'
import styles from './NewMeetingModal.module.css'

interface NewMeetingModalProps {
  onClose: () => void
}

export default function NewMeetingModal({ onClose }: NewMeetingModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [videoOn, setVideoOn] = useState(false)
  const [usePMI, setUsePMI] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    function computePosition() {
      const btn = document.getElementById('action-new-meeting')
      if (btn) {
        setAnchorRect(btn.getBoundingClientRect())
      }
    }

    computePosition()
    window.addEventListener('resize', computePosition)
    return () => window.removeEventListener('resize', computePosition)
  }, [])

  // Close on Escape key
  useLayoutEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, loading])

  // Close on overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !loading) onClose()
  }

  async function handleStartMeeting() {
    try {
      setLoading(true)
      setError(null)
      const meeting = await createMeeting({
        title: "My Meeting",
        meeting_type: "instant",
        passcode: passcode.trim() || undefined,
      })
      // Strip spaces from meeting_id
      const cleanId = meeting.meeting_id.replace(/\s+/g, '')
      onClose()
      router.push(`/room/${cleanId}?name=Shrayash+Awasthi&host=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start meeting")
      setLoading(false)
    }
  }

  if (!anchorRect) {
    return null
  }

  // Calculate anchored position (centered under the button)
  const popupWidth = 300
  let leftPos = anchorRect.left + (anchorRect.width / 2) - (popupWidth / 2)
  // Responsive clamping
  const margin = 16
  if (leftPos + popupWidth > window.innerWidth - margin) {
    leftPos = window.innerWidth - popupWidth - margin
  }
  if (leftPos < margin) leftPos = margin

  // Vertical position and height limits
  const spaceBelow = window.innerHeight - anchorRect.bottom
  const spaceAbove = anchorRect.top
  
  let topPos: number | undefined = anchorRect.bottom + 8
  let bottomPos: number | undefined = undefined
  let maxHeight = `calc(100vh - ${anchorRect.bottom + margin}px)`

  // Flip above the button if there is not enough room below and there is more room above
  if (spaceBelow < 320 && spaceAbove > spaceBelow) {
    topPos = undefined
    bottomPos = window.innerHeight - anchorRect.top + 8
    maxHeight = `calc(${anchorRect.top - margin}px)`
  }

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="New Meeting"
    >
      <div 
        className={styles.modal}
        style={{ 
          top: topPos,
          bottom: bottomPos,
          left: leftPos,
          maxHeight,
        }}
      >
        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Start with video</span>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={videoOn} 
              onChange={(e) => setVideoOn(e.target.checked)} 
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.toggleRow}>
          <span className={styles.toggleLabel}>Use my Personal Meeting ID (PMI) 554 269 9869</span>
          <label className={styles.switch}>
            <input 
              type="checkbox" 
              checked={usePMI} 
              onChange={(e) => setUsePMI(e.target.checked)} 
              disabled={loading}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.passcodeRow}>
          <label className={styles.passcodeLabel} htmlFor="modal-passcode">
            Passcode <span className={styles.passcodeOptional}>(optional)</span>
          </label>
          <input
            id="modal-passcode"
            type="text"
            className={styles.passcodeInput}
            placeholder="Leave blank for no passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.substring(0, 32))}
            disabled={loading}
            autoComplete="off"
          />
        </div>

        <div className={styles.divider} />

        <button 
          className={styles.startBtn} 
          onClick={handleStartMeeting}
          disabled={loading}
        >
          {loading ? 'Starting...' : 'Start Meeting'}
        </button>
        
        {error && (
          <p className={styles.error}>{error}</p>
        )}
      </div>
    </div>
  )
}
