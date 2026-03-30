import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

interface IMicroWidgetPropsContext {
    microWidgetProps: any
    setMicroWidgetProps: Dispatch<SetStateAction<any>>
}

interface IMicroWidgetPropsProvider {
    initMicroWidgetProps: any
    children: ReactNode
}

export const MicroWidgetPropsContext =
    React.createContext<IMicroWidgetPropsContext>({
        microWidgetProps: {},
        setMicroWidgetProps: noop,
    })

export const MicroWidgetPropsProvider: React.FC<IMicroWidgetPropsProvider> = ({
    initMicroWidgetProps = {},
    children,
}) => {
    const [microWidgetProps, setMicroWidgetProps] =
        useState(initMicroWidgetProps)
    const values = useMemo(
        () => ({ microWidgetProps, setMicroWidgetProps }),
        [microWidgetProps, setMicroWidgetProps],
    )

    return (
        <MicroWidgetPropsContext.Provider value={values}>
            {children}
        </MicroWidgetPropsContext.Provider>
    )
}
