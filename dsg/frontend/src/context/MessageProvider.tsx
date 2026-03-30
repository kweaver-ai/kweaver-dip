import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
} from 'react'
import { noop } from 'lodash'

interface IMessageInfo {
    [key: string]: number
}

interface IMessageContext {
    messageInfo: IMessageInfo
    setMessageInfo: Dispatch<SetStateAction<IMessageInfo>>
}

interface IMessageProvider {
    initMessageInfo: IMessageInfo
    children: ReactNode
}

export const MessageContext = React.createContext<IMessageContext>({
    messageInfo: {},
    setMessageInfo: noop,
})

export const MessageProvider: React.FC<IMessageProvider> = ({
    initMessageInfo = {},
    children,
}) => {
    const [messageInfo, setMessageInfo] = useState(initMessageInfo)
    const values = useMemo(
        () => ({ messageInfo, setMessageInfo }),
        [messageInfo, setMessageInfo],
    )

    return (
        <MessageContext.Provider value={values}>
            {children}
        </MessageContext.Provider>
    )
}
