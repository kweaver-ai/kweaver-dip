import { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import DipChatKit from '@/components/DipChatKit'
import useSyncHistorySessions from '@/hooks/useSyncHistorySessions'
import type { ConversationRouteState } from './types'

const SUBMIT_CONSUMED_PREFIX = 'dip-chatkit-submit-consumed'

const Conversation = () => {
  useSyncHistorySessions()

  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const employeeFromQuery = searchParams.get('employee')
  const sessionKeyFromQuery = searchParams.get('sessionKey')?.trim() || ''
  const routeState = (location.state || {}) as ConversationRouteState & Record<string, unknown>
  const submitData = routeState.submitData
  const submitToken = routeState.submitToken?.trim() || ''
  const consumedStorageKey = submitToken ? `${SUBMIT_CONSUMED_PREFIX}:${submitToken}` : ''
  const initialSessionKeyRef = useRef(sessionKeyFromQuery)

  const initialSubmitPayload = useMemo(() => {
    if (!submitData) return undefined
    if (!consumedStorageKey) return submitData
    const consumed = window.sessionStorage.getItem(consumedStorageKey) === '1'
    return consumed ? undefined : submitData
  }, [consumedStorageKey, submitData])

  const defaultEmployeeValue = useMemo(() => {
    if (employeeFromQuery) {
      return employeeFromQuery
    }
    return submitData?.employees?.[0]?.value
  }, [employeeFromQuery, submitData])

  useEffect(() => {
    if (!initialSubmitPayload) return

    if (consumedStorageKey) {
      window.sessionStorage.setItem(consumedStorageKey, '1')
    }

    if (!(submitData || submitToken)) return
    const nextState: Record<string, unknown> = { ...routeState }
    delete nextState.submitData
    delete nextState.submitToken
    navigate(
      {
        pathname: location.pathname,
        search: location.search,
      },
      {
        replace: true,
        state: Object.keys(nextState).length > 0 ? nextState : null,
      },
    )
  }, [
    consumedStorageKey,
    initialSubmitPayload,
    location.pathname,
    location.search,
    navigate,
    routeState,
    submitData,
    submitToken,
  ])

  const handleSessionKeyReady = useCallback(
    (sessionKey: string) => {
      const normalizedSessionKey = sessionKey.trim()
      if (!normalizedSessionKey || normalizedSessionKey === sessionKeyFromQuery) return

      const nextSearchParams = new URLSearchParams(location.search)
      nextSearchParams.set('sessionKey', normalizedSessionKey)
      navigate(
        {
          pathname: location.pathname,
          search: `?${nextSearchParams.toString()}`,
        },
        {
          replace: true,
          state: routeState,
        },
      )
    },
    [location.pathname, location.search, navigate, routeState, sessionKeyFromQuery],
  )

  return (
    <div className="h-full w-full box-border">
      <div className="h-full min-h-0">
        <DipChatKit
          initialSubmitPayload={initialSubmitPayload}
          sessionId={initialSessionKeyRef.current || undefined}
          assignEmployeeValue={defaultEmployeeValue}
          onSessionKeyReady={handleSessionKeyReady}
        />
      </div>
    </div>
  )
}

export default memo(Conversation)
