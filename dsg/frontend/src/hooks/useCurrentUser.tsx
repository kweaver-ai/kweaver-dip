import { useEffect, useState, useMemo } from 'react'
import { getInnerUrl } from '@/utils'
import { getUserInfo, formatError } from '@/core'
import { loginRoutePath } from '@/routers/config'

let globalUserInfo = null
let pendingPromise: Promise<boolean> | null = null

export const useCurrentUser = (attr?: string): any => {
    const [user, setUser] = useState(globalUserInfo)
    const pathname = getInnerUrl(window.location.pathname)

    const getUser = async () => {
        if (loginRoutePath.includes(pathname)) {
            return
        }

        pendingPromise = getUserInfo()
            .then((res) => {
                setUser(res)
                globalUserInfo = res
                pendingPromise = null
                return res
            })
            .catch((error) => {
                if (loginRoutePath.includes(pathname)) {
                    pendingPromise = null
                    return null
                }
                // formatError(error)
                pendingPromise = null
                return null
            })
    }
    useEffect(() => {
        if (pendingPromise) {
            pendingPromise.then(() => {
                setUser(globalUserInfo)
            })
        } else if (!globalUserInfo) {
            getUser()
        } else {
            setUser(globalUserInfo)
        }
    }, [pathname])
    return [useMemo(() => (attr ? user?.[attr] : user), [user]), getUser]
}
