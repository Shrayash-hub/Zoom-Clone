'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ComingSoonToast from '@/components/common/ComingSoonToast'
import styles from './Sidebar.module.css'

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MeetingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 10L20.5 6.5V17.5L15 14V10Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="6"
        width="12"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="19" r="1.5" fill="currentColor" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  )
}


// ── Nav items config ──────────────────────────────────────────────────────────

type NavItemConfig = {
  label: string
  icon: React.FC
  href: string | null
  id: string
}

const NAV_ITEMS: NavItemConfig[] = [
  { label: 'Home',     icon: HomeIcon,     href: '/',         id: 'nav-home' },
  { label: 'Meetings', icon: MeetingsIcon, href: '/meetings', id: 'nav-meetings' },
  { label: 'Chat',     icon: ChatIcon,     href: null,        id: 'nav-chat' },
  { label: 'More',     icon: MoreIcon,     href: null,        id: 'nav-more' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname()
  const [comingSoonVisible, setComingSoonVisible] = useState(false)

  function showComingSoon() {
    setComingSoonVisible(true)
    setTimeout(() => setComingSoonVisible(false), 2000)
  }

  function isActive(href: string | null): boolean {
    if (!href) return false
    return pathname === href
  }

  return (
    <nav className={styles.sidebar} aria-label="Primary navigation">
      <ul className={styles.navList} role="list">
        {NAV_ITEMS.map(({ label, icon: Icon, href, id }) => {
          const active = isActive(href)
          const itemClass = `${styles.navItem}${active ? ` ${styles.active}` : ''}`

          return (
            <li key={id}>
              {href ? (
                <Link
                  id={id}
                  href={href}
                  className={itemClass}
                  aria-current={active ? 'page' : undefined}
                  aria-label={label}
                >
                  <span className={styles.iconWrapper}>
                    <Icon />
                  </span>
                  <span className={styles.label}>{label}</span>
                </Link>
              ) : (
                <button
                  id={id}
                  className={itemClass}
                  aria-label={label}
                  type="button"
                  onClick={id === 'nav-chat' ? showComingSoon : undefined}
                >
                  <span className={styles.iconWrapper}>
                    <Icon />
                  </span>
                  <span className={styles.label}>{label}</span>
                </button>
              )}
            </li>
          )
        })}
      </ul>

      <div className={styles.bottomSection}>
        <button
          id="nav-settings"
          className={styles.navItem}
          aria-label="Settings"
          type="button"
        >
          <span className={styles.iconWrapper}>
            <SettingsIcon />
          </span>
          <span className={styles.label}>Settings</span>
        </button>
      </div>
      
      <ComingSoonToast visible={comingSoonVisible} />
    </nav>
  )
}
