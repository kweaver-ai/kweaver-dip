import { ReactNode, createContext, useContext, useMemo } from 'react'
import __ from './locale'

type IResShareDrawerContext = {
    [key: string]: any
}

const ResShareDrawerContext = createContext<IResShareDrawerContext>({})

/**
 * 资源共享 drawer Provider
 */
export const useResShareDrawerContext = () =>
    useContext<IResShareDrawerContext>(ResShareDrawerContext)

export const ResShareDrawerProvider = ({
    children,
}: {
    children: ReactNode
}) => {
    const values = useMemo(() => ({}), [])
    return (
        <ResShareDrawerContext.Provider value={values}>
            {children}
        </ResShareDrawerContext.Provider>
    )
}
