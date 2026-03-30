import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'
import { BusinessView } from './nodes/helper'

interface IGraphContext {
    currentNodeData: any
    setCurrentNodeData: Dispatch<SetStateAction<any>>
    businView: BusinessView
    setBusinView: Dispatch<SetStateAction<BusinessView>>
}

const initContext: IGraphContext = {
    currentNodeData: {},
    setCurrentNodeData: () => {},
    businView: BusinessView.Organization,
    setBusinView: (newBusinView) => {},
}

const GraphContext = createContext<IGraphContext>(initContext)

export const useBusinViewContext = () => useContext<IGraphContext>(GraphContext)

export const BusinViewProvider = ({ children }: { children: ReactNode }) => {
    const [currentNodeData, setCurrentNodeData] = useState<any>({})
    const [businView, setBusinView] = useState<BusinessView>(
        BusinessView.Organization,
    )

    const values = useMemo(
        () => ({
            currentNodeData,
            setCurrentNodeData,
            businView,
            setBusinView,
        }),
        [currentNodeData, setCurrentNodeData, businView, setBusinView],
    )

    return (
        <GraphContext.Provider value={values}>{children}</GraphContext.Provider>
    )
}
