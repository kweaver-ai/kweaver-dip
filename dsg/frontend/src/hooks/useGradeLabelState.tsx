import { useEffect, useMemo, useState } from 'react'
import {
    GradeLabelStatusEnum,
    formatError,
    getDataGradeLabelStatus,
} from '@/core'

let globalGradeLabelState: boolean | undefined

export const useGradeLabelState = (): [
    boolean | undefined,
    () => Promise<void>,
] => {
    const [gradeLabelStatus, setGradeLabelStatus] = useState<
        boolean | undefined
    >(globalGradeLabelState)

    const getGradeLabelState = async () => {
        try {
            const res: GradeLabelStatusEnum = await getDataGradeLabelStatus()
            setGradeLabelStatus(res === GradeLabelStatusEnum.Open)
            globalGradeLabelState = res === GradeLabelStatusEnum.Open
        } catch (err) {
            formatError(err)
        }
    }
    useEffect(() => {
        if (globalGradeLabelState === undefined) {
            getGradeLabelState()
        }
    }, [])

    return [
        useMemo(() => gradeLabelStatus, [gradeLabelStatus]),
        getGradeLabelState,
    ]
}
