'use client'

import { useState, useEffect } from 'react'
import styles from './InviteModal.module.css'

interface InviteModalProps {
  meetingId: string
  inviteLink: string
  passcode?: string
  onClose: () => void
}

function formatMeetingId(raw: string): string {
  const digits = raw.replace(/\s+/g, '')
  if (digits.length === 9) {
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
  }
  if (digits.length === 10) {
    return `${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`
  }
  return raw
}

export default function InviteModal({ meetingId, inviteLink, passcode, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false)

  // Escape key to close
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleCopy() {
    let text = inviteLink
    if (passcode) {
      text = `${inviteLink}\nPasscode: ${passcode}`
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className={styles.overlay} onClick={(e) => {
      if (e.target === e.currentTarget) onClose()
    }}>
      <div className={styles.modal} style={{ maxWidth: 480 }}>
        <div className={styles.header}>
          <span className={styles.title}>Invite people to join the meeting</span>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        
        <div style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Meeting ID</span>
            <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
              {formatMeetingId(meetingId)}
            </span>
          </div>

          {passcode && (
            <div>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Passcode</span>
              <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', letterSpacing: '0.05em' }}>
                {passcode}
              </span>
            </div>
          )}

          <div>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Invite Link</span>
            <div style={{ 
              padding: '10px 12px', 
              background: 'var(--color-surface-hover)', 
              borderRadius: 'var(--radius-sm)',
              wordBreak: 'break-all',
              fontSize: 14,
              color: 'var(--color-primary)'
            }}>
              {inviteLink}
            </div>
          </div>
        </div>

        <div className={styles.divider} />
        
        <button className={styles.startBtn} onClick={handleCopy}>
          {copied ? 'Copied!' : 'Copy Invite Link'}
        </button>
      </div>
    </div>
  )
}
