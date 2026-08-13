'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMeetings } from '@/lib/api'
import type { Meeting } from '@/types'

const POLL_INTERVAL_MS = 30_000

interface UseHomeDataResult {
  upcoming: Meeting[]
  recent: Meeting[]
  loading: boolean
  error: string | null
}

/**
 * Fetches upcoming + recent meetings in a single API call on mount,
 * then re-fetches every 30 seconds.
 */
export function useHomeData(): UseHomeDataResult {
  const [upcoming, setUpcoming] = useState<Meeting[]>([])
  const [recent, setRecent] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const data = await getMeetings()
      setUpcoming(data.upcoming)
      setRecent(data.recent)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load meetings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchData])

  return { upcoming, recent, loading, error }
}
