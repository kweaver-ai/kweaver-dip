import { useSetState } from 'ahooks'
import { useState } from 'react'
import { delDesenRule } from '@/core'
import { scheduleReq } from './scheduleReq'

const mock = (params: any) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.random() > 0) {
                resolve(params)
            } else {
                reject(new Error('失败'))
            }
        }, 4000)
    })
}

export const useBatchDel = (opts: {
    onComplete?: (params: any[], ...args: any[]) => void
}) => {
    const { onComplete } = opts
    const [delState, setDelState] = useSetState({
        successCount: 0,
        failedCount: [] as any[],
        total: 1,
    })
    const [current, setCurrent] = useState(0)
    const [allCompleted, setAllCompleted] = useState(false)
    const batchDel = (paramsOther: any[]) => {
        setDelState({
            total: paramsOther.length,
            failedCount: [],
            successCount: 0,
        })
        setCurrent(0)
        setAllCompleted(false)
        scheduleReq({
            params: paramsOther,
            request: delDesenRule,
            onSuccess(cur, successCount) {
                setDelState({
                    successCount,
                })
                setCurrent(cur)
            },
            onFail(errParams) {
                setDelState((prev) => {
                    const newState = { ...prev }
                    const failedCount = [...newState.failedCount]
                    failedCount.push(errParams)
                    newState.failedCount = failedCount
                    return newState
                })
            },
            onCompleted() {
                setAllCompleted(true)
                // setDelState({ failedCount: [], current: 1, successCount: 0 })
                if (onComplete) {
                    onComplete(paramsOther, delState)
                }
            },
        })
    }

    const progress = Math.round((delState.successCount / delState.total) * 100)

    return {
        ...delState,
        current,
        progress,
        allCompleted,
        onComplete,
        batchDel,
    }
}
