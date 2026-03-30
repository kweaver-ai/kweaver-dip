import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

interface IDrawioInfoContext {
    drawioInfo: IDrawioInfo
    setDrawioInfo: Dispatch<SetStateAction<IDrawioInfo>>
}

interface IDrawioInfoProvider {
    children: ReactNode
}

interface IDrawioInfo {
    [key: string]: any
}

export const DrawioInfoContext = React.createContext<IDrawioInfoContext>({
    drawioInfo: {},
    setDrawioInfo: noop,
})

export const DrawioInfoProvider: React.FC<IDrawioInfoProvider> = ({
    children,
}) => {
    const [drawioInfo, setDrawioInfo] = useState({})
    const values = useMemo(
        () => ({ drawioInfo, setDrawioInfo }),
        [drawioInfo, setDrawioInfo],
    )

    return (
        <DrawioInfoContext.Provider value={values}>
            {children}
        </DrawioInfoContext.Provider>
    )
}
