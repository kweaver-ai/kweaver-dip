import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'

interface IStatusContext {
    viewChange: boolean
    setViewChange: Dispatch<SetStateAction<boolean>>
}

export const StatusContext = createContext<IStatusContext>({
    viewChange: false,
    setViewChange: () => {},
})

export const useStatusContext = () => useContext<IStatusContext>(StatusContext)

export const StatusProvider = ({ children }: { children: ReactNode }) => {
    const [viewChange, setViewChange] = useState<boolean>(false)

    const values = useMemo(
        () => ({
            viewChange,
            setViewChange,
        }),
        [viewChange, setViewChange],
    )
    return (
        <StatusContext.Provider value={values}>
            {children}
        </StatusContext.Provider>
    )
}
