import { useEffect } from 'react'
import { useUserHistoryStore } from '@/stores/userHistoryStore'
import { useUserWorkPlanStore } from '@/stores/userWorkPlanStore'

const SIDER_SYNC_INTERVAL_MS = 5000
const SIDER_SYNC_INITIAL_DELAY_MS = 2000

const useSyncHistorySessions = () => {
  const fetchSessions = useUserHistoryStore((state) => state.fetchSessions)
  const fetchPlans = useUserWorkPlanStore((state) => state.fetchPlans)

  useEffect(() => {
    let stopped = false
    let intervalId: number | undefined

    const runSync = () => {
      if (stopped) return
      if (document.visibilityState !== 'visible') return
      void fetchSessions({ silent: true })
      void fetchPlans({ silent: true })
    }

    const initialTimer = window.setTimeout(() => {
      if (stopped) return
      runSync()
      intervalId = window.setInterval(runSync, SIDER_SYNC_INTERVAL_MS)
    }, SIDER_SYNC_INITIAL_DELAY_MS)

    document.addEventListener('visibilitychange', runSync)

    return () => {
      stopped = true
      window.clearTimeout(initialTimer)
      if (intervalId !== undefined) {
        window.clearInterval(intervalId)
      }
      document.removeEventListener('visibilitychange', runSync)
    }
  }, [fetchPlans, fetchSessions])
}

export default useSyncHistorySessions
