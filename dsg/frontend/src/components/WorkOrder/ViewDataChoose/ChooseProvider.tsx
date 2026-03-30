import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'

type IDatasheetView = any

interface IChooseContext {
    views: IDatasheetView[]
    setViews: Dispatch<SetStateAction<IDatasheetView[]>>
}

export const ChooseContext = createContext<IChooseContext>({
    views: [],
    setViews: () => {},
})

export const useChooseContext = () => useContext<IChooseContext>(ChooseContext)

export const StatusProvider = ({ children }: { children: ReactNode }) => {
    const [views, setViews] = useState<IDatasheetView[]>([])

    const values = useMemo(
        () => ({
            views,
            setViews,
        }),
        [views, setViews],
    )
    return (
        <ChooseContext.Provider value={values}>
            {children}
        </ChooseContext.Provider>
    )
}
