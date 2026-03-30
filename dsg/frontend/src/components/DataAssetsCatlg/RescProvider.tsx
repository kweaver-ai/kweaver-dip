import {
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { CatlgView } from './const'
import __ from './locale'

type IRescProviderContext = {
    catlgView: CatlgView
    setCatlgView: (item: CatlgView) => void
    [key: string]: any
}

const RescProviderContext = createContext<IRescProviderContext>({
    catlgView: CatlgView.DATA,
    setCatlgView: () => {},
})

export const useRescProviderContext = () =>
    useContext<IRescProviderContext>(RescProviderContext)

export const RescProvider = ({ children }: { children: ReactNode }) => {
    const defaultCatlgView = CatlgView.DATA
    const [catlgView, setCatlgView] = useState<CatlgView>(defaultCatlgView)
    const resetCatlgView = useCallback(() => {
        setCatlgView(defaultCatlgView)
    }, [defaultCatlgView])

    const values = useMemo(
        () => ({
            catlgView,
            resetCatlgView,
            setCatlgView,
        }),
        [catlgView, resetCatlgView, setCatlgView],
    )

    return (
        <RescProviderContext.Provider value={values}>
            {children}
        </RescProviderContext.Provider>
    )
}
