import { ReactNode, createContext, useContext, useMemo, useState } from 'react'
import __ from './locale'

type IViewGraphContext = {
    [key: string]: any
}

const ViewGraphContext = createContext<IViewGraphContext>({})

export const useViewGraphContext = () =>
    useContext<IViewGraphContext>(ViewGraphContext)

export const ViewGraphProvider = ({ children }: { children: ReactNode }) => {
    // 算子切换时被中断操作的数据
    const [continueFn, setContinueFn] = useState<{
        flag: string
        fn: any
        params: any
    }>()

    const values = useMemo(
        () => ({ continueFn, setContinueFn }),
        [continueFn, setContinueFn],
    )
    return (
        <ViewGraphContext.Provider value={values}>
            {children}
        </ViewGraphContext.Provider>
    )
}
