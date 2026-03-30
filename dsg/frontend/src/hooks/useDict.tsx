import { useEffect, useMemo, useState } from 'react'
import {
    DataDictQueryType,
    IDataDicts,
    formatError,
    getDataDicts,
} from '@/core'

let globalDict: IDataDicts[] = []
let pendingPromise: any

/**
 * 获取字典
 */
export const useDict = (): [IDataDicts[], () => Promise<void>] => {
    const [dict, setDict] = useState<IDataDicts[]>(globalDict)

    const getDict = async () => {
        if (pendingPromise) {
            return
        }
        pendingPromise = getDataDicts(DataDictQueryType.All)
            .then((res) => {
                setDict(res?.dicts || [])
                globalDict = res?.dicts || []
                pendingPromise = null
                return res
            })
            .catch((error) => {
                formatError(error)
                pendingPromise = null
                return null
            })
    }

    useEffect(() => {
        if (pendingPromise) {
            pendingPromise.then(() => {
                setDict(globalDict)
            })
        } else if (!globalDict.length) {
            getDict()
        } else {
            setDict(globalDict)
        }
    }, [])

    return [useMemo(() => dict, [dict]), getDict]
}
