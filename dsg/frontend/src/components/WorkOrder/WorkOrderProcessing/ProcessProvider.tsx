import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'

interface IProcessContext {
    processInfo: any
    setProcessInfo: Dispatch<SetStateAction<any>>
}

export const ProcessContext = createContext<IProcessContext>({
    processInfo: { canSubmit: false },
    setProcessInfo: () => {},
})

export const useProcessContext = () =>
    useContext<IProcessContext>(ProcessContext)

export const ProcessProvider = ({ children }: { children: ReactNode }) => {
    const [processInfo, setProcessInfo] = useState<any>({ canSubmit: false })

    const values = useMemo(
        () => ({
            processInfo,
            setProcessInfo,
        }),
        [processInfo, setProcessInfo],
    )
    return (
        <ProcessContext.Provider value={values}>
            {children}
        </ProcessContext.Provider>
    )
}
