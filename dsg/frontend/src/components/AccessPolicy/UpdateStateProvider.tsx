import React, {
    ReactNode,
    createContext,
    useContext,
    useState,
    useMemo,
} from 'react'

interface IUpdateStateContext {
    hasAccessChange: boolean
    setHasAccessChange: (value: boolean) => void
}

export const UpdateStateContext = createContext<IUpdateStateContext>({
    hasAccessChange: false,
    setHasAccessChange: () => {},
})

export const useUpdateStateContext = () => useContext(UpdateStateContext)

interface IUpdateStateProviderProps {
    children: ReactNode
}

/**
 * UpdateStateProvider 用于跟踪 AccessModal 中的权限或规则变更状态
 */
export const UpdateStateProvider: React.FC<IUpdateStateProviderProps> = ({
    children,
}) => {
    const [hasAccessChange, setHasAccessChange] = useState<boolean>(false)

    const resetAccessChange = () => {
        setHasAccessChange(false)
    }

    const values: IUpdateStateContext = useMemo(
        () => ({
            hasAccessChange,
            setHasAccessChange,
            resetAccessChange,
        }),
        [hasAccessChange],
    )

    return (
        <UpdateStateContext.Provider value={values}>
            {children}
        </UpdateStateContext.Provider>
    )
}
