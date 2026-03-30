import React, {
    ReactNode,
    useState,
    useMemo,
    Dispatch,
    SetStateAction,
    useContext,
} from 'react'
import { noop } from 'lodash'

interface ISqlExplainContext {
    sqlExplainRecord: string[]
    setSqlExplainRecord: Dispatch<SetStateAction<string[]>>
}

export const SqlExplainContext = React.createContext<ISqlExplainContext>({
    sqlExplainRecord: [],
    setSqlExplainRecord: noop,
})

export const useSqlExplainContext = () =>
    useContext<ISqlExplainContext>(SqlExplainContext)

export const SqlExplainProvider = ({ children }: { children: ReactNode }) => {
    const [sqlExplainRecord, setSqlExplainRecord] = useState<string[]>([])
    const values = useMemo(
        () => ({ sqlExplainRecord, setSqlExplainRecord }),
        [sqlExplainRecord, setSqlExplainRecord],
    )

    return (
        <SqlExplainContext.Provider value={values}>
            {children}
        </SqlExplainContext.Provider>
    )
}
