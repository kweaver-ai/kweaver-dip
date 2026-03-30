import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'
import { ViewMode } from '@/components/DataCatalogUnderstanding/const'

interface IGraphContext {
    viewMode: ViewMode
    setViewMode: Dispatch<SetStateAction<ViewMode>>
    // 目录列表数据
    catalogData: any[]
    setCatalogData: Dispatch<SetStateAction<any[]>>
    // 目录信息项数据
    columnData: any[]
    setColumnData: Dispatch<SetStateAction<any[]>>
}

const initContext: IGraphContext = {
    viewMode: ViewMode.VIEW,
    setViewMode: () => {},
    catalogData: [],
    setCatalogData: () => {},
    columnData: [],
    setColumnData: () => {},
}

const GraphContext = createContext<IGraphContext>(initContext)

export const useUndsGraphContext = () => useContext<IGraphContext>(GraphContext)

export const UndsGraphProvider = ({ children }: { children: ReactNode }) => {
    const [viewMode, setViewMode] = useState<any>(ViewMode.VIEW)
    const [catalogData, setCatalogData] = useState<any[]>([])
    const [columnData, setColumnData] = useState<any[]>([])

    const values = useMemo(
        () => ({
            viewMode,
            setViewMode,
            catalogData,
            setCatalogData,
            columnData,
            setColumnData,
        }),
        [
            viewMode,
            setViewMode,
            catalogData,
            setCatalogData,
            columnData,
            setColumnData,
        ],
    )
    return (
        <GraphContext.Provider value={values}>{children}</GraphContext.Provider>
    )
}
