import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

interface IConfigInfoContext {
    configInfo: IConfigInfo
    setConfigInfo: Dispatch<SetStateAction<IConfigInfo>>
}

interface IConfigInfoProvider {
    initConfigInfo: IConfigInfo
    children: ReactNode
}

interface IConfigInfo {
    [key: string]: any
}

export const initConfigInfoData = {
    indexSiderBarCollapsed: false,
    domainSiderBarCollapsed: false,
}

export const ConfigInfoContext = React.createContext<IConfigInfoContext>({
    configInfo: initConfigInfoData,
    setConfigInfo: noop,
})

export const ConfigInfoProvider: React.FC<IConfigInfoProvider> = ({
    initConfigInfo = initConfigInfoData,
    children,
}) => {
    const [configInfo, setConfigInfo] = useState(initConfigInfo)
    const values = useMemo(
        () => ({ configInfo, setConfigInfo }),
        [configInfo, setConfigInfo],
    )

    return (
        <ConfigInfoContext.Provider value={values}>
            {children}
        </ConfigInfoContext.Provider>
    )
}
