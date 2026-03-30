import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

interface IFrameworkContext {
    appProps: Record<string, any>
    setAppProps: Dispatch<SetStateAction<Record<string, any>>>
}

export const FrameworkContext = React.createContext<IFrameworkContext>({
    appProps: {},
    setAppProps: noop,
})

interface IFrameworkProvider {
    initAppProps: Record<string, any>
    children: ReactNode
}

export const FrameworkProvider: React.FC<IFrameworkProvider> = ({
    initAppProps = {},
    children,
}) => {
    const [appProps, setAppProps] = useState(initAppProps)
    const values = useMemo(
        () => ({ appProps, setAppProps }),
        [appProps, setAppProps],
    )

    return (
        <FrameworkContext.Provider value={values}>
            {children}
        </FrameworkContext.Provider>
    )
}
