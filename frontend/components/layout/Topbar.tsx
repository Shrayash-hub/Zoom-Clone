'use client'

import { useState, useRef, useEffect } from 'react'
import ComingSoonToast from '@/components/common/ComingSoonToast'
import styles from './Topbar.module.css'

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function ZoomCameraIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={styles.logoIcon}
    >
      <rect width="40" height="40" rx="10" fill="#0e71eb" />
      <path
        d="M23.5 17.5V14C23.5 13.17 22.83 12.5 22 12.5H10C9.17 12.5 8.5 13.17 8.5 14V26C8.5 26.83 9.17 27.5 10 27.5H22C22.83 27.5 23.5 26.83 23.5 26V22.5L31.5 27.5V12.5L23.5 17.5Z"
        fill="white"
      />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={styles.statusCheck} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-icon-default)' }}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  )
}

type StatusType = 'Available' | 'Busy' | 'Do Not Disturb' | 'Away' | 'Out of Office';

const STATUS_OPTIONS: { label: StatusType, className?: string }[] = [
  { label: 'Available', className: styles.statusAvailable },
  { label: 'Busy', className: styles.statusBusy },
  { label: 'Do Not Disturb', className: styles.statusDnd },
  { label: 'Away', className: styles.statusAway },
  { label: 'Out of Office', className: styles.statusOoo }
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Topbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [status, setStatus] = useState<StatusType>('Available')
  const [comingSoonVisible, setComingSoonVisible] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  function showComingSoon() {
    setComingSoonVisible(true)
    setTimeout(() => setComingSoonVisible(false), 2000)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setDropdownOpen(false)
    }
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const getStatusClass = (s: StatusType) => {
    return STATUS_OPTIONS.find(opt => opt.label === s)?.className || ''
  }

  return (
    <header className={styles.topbar} role="banner">

      {/* Left: Zoom logo lockup */}
      <div className={styles.logoSection} aria-label="Zoom Workplace">
        <ZoomCameraIcon />
        <div className={styles.logoText}>
          <span className={styles.logoWordmark}>zoom</span>
          <span className={styles.logoSub}>Workplace</span>
        </div>
      </div>

      {/* Center-left: Navigation controls */}
      <div className={styles.navControls} aria-label="Navigation history">
        <button
          id="topbar-back"
          className={styles.iconBtn}
          aria-label="Go back"
          type="button"
        >
          <ChevronLeftIcon />
        </button>
        <button
          id="topbar-forward"
          className={styles.iconBtn}
          aria-label="Go forward"
          type="button"
        >
          <ChevronRightIcon />
        </button>
        <button
          id="topbar-history"
          className={styles.iconBtn}
          aria-label="Navigation history"
          type="button"
        >
          <ClockIcon />
        </button>
      </div>

      {/* Center: Search bar */}
      <div className={styles.searchWrapper} role="search">
        <label className={styles.searchBar} htmlFor="topbar-search">
          <span className={styles.searchIcon}>
            <SearchIcon />
          </span>
          <input
            id="topbar-search"
            type="search"
            className={styles.searchInput}
            placeholder="Search"
            aria-label="Search"
          />
          <span className={styles.searchShortcut} aria-hidden="true">Ctrl+K</span>
        </label>
      </div>

      {/* Right: Upgrade + Avatar */}
      <div className={styles.rightSection}>
        <button
          id="topbar-upgrade"
          className={styles.upgradeBtn}
          type="button"
          aria-label="Upgrade plan"
        >
          Upgrade
        </button>

        <div className={styles.avatarWrapper} ref={dropdownRef}>
          <div
            id="topbar-avatar"
            className={styles.avatar}
            role="button"
            tabIndex={0}
            onClick={() => setDropdownOpen(prev => !prev)}
            aria-label="User profile menu"
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setDropdownOpen(prev => !prev)
              }
            }}
          >
            S
          </div>
          <span className={`${styles.onlineDot} ${getStatusClass(status)}`} aria-label={status}>
             {status === 'Out of Office' && <CalendarIcon />}
          </span>

          {dropdownOpen && (
            <div className={styles.dropdown} role="menu">
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownName}>Shrayash Awasthi</span>
                <span className={styles.dropdownEmail}>awasthishrayashofc@gmail.com</span>
              </div>
              <div className={styles.dropdownDivider} />
              
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => {
                    setStatus(opt.label)
                    // we don't automatically close the dropdown when changing status usually, 
                    // but depending on UX it could be nice. We will keep it open so user can see it updated.
                  }}
                >
                  {opt.label === 'Out of Office' ? (
                     <span className={styles.statusIcon} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <CalendarIcon />
                     </span>
                  ) : (
                    <span className={`${styles.statusIcon} ${opt.className}`} />
                  )}
                  <span className={styles.dropdownItemText}>{opt.label}</span>
                  {status === opt.label && <CheckIcon />}
                </button>
              ))}

              <div className={styles.dropdownDivider} />
              
              <button className={styles.dropdownItem} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }} role="menuitem">
                <span className={styles.dropdownItemText}>My Profile</span>
              </button>
              <button className={styles.dropdownItem} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }} role="menuitem">
                <span className={styles.dropdownItemText}>About</span>
              </button>
              <button className={styles.dropdownItem} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }} role="menuitem">
                <span className={styles.dropdownItemText}>Help</span>
              </button>
              <button className={styles.dropdownItem} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }} role="menuitem">
                <span className={styles.dropdownItemText}>Language</span>
                <span className={styles.dropdownItemRight}>English</span>
              </button>
              
              <div className={styles.dropdownDivider} />
              
              <button className={styles.dropdownItem} onClick={showComingSoon} aria-disabled="true" style={{ opacity: 0.5, cursor: 'not-allowed' }} role="menuitem">
                <span className={styles.dropdownItemText}>Sign Out</span>
              </button>
              
              <a 
                href="#" 
                className={styles.downloadLink} 
                onClick={(e) => { e.preventDefault(); showComingSoon() }}
                aria-disabled="true"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
                role="menuitem"
              >
                Download the Zoom app
              </a>
            </div>
          )}
        </div>
      </div>
      
      <ComingSoonToast visible={comingSoonVisible} />
    </header>
  )
}

