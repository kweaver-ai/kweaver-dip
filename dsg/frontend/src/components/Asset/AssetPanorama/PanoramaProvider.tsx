import React, {
    ReactNode,
    createContext,
    useContext,
    useMemo,
    useState,
    Dispatch,
    SetStateAction,
} from 'react'
import { AssetNodes } from './helper'

type INode = any

interface IPanoramaContext {
    currentNode: INode
    setCurrentNode: Dispatch<SetStateAction<INode>>
    activeId: string
    setActiveId: Dispatch<SetStateAction<string>>
    shrink: string
    setShrink: Dispatch<SetStateAction<string>>
    groupNodeMap: Record<string, INode>
    optGroupNodeMap: (id: string, node: INode) => void
    selectedCount: {
        id: string
        type: AssetNodes | string
        domainType: string
        domainName: string
    }
    setSelectedCount: (data: {
        id: string
        type: AssetNodes | string
        domainType: string
        domainName: string
    }) => void
    searchSelectedNodeId: string
    setSearchSelectedNodeId: (nodeId: string) => void
}

export const PanoramaContext = createContext<IPanoramaContext>({
    currentNode: null,
    setCurrentNode: () => {},
    activeId: '',
    setActiveId: () => {},
    shrink: '',
    setShrink: () => {},
    groupNodeMap: {},
    optGroupNodeMap: () => {},
    selectedCount: { id: '', type: '', domainName: '', domainType: '' },
    setSelectedCount: () => {},
    searchSelectedNodeId: '',
    setSearchSelectedNodeId: () => {},
})

export const usePanoramaContext = () =>
    useContext<IPanoramaContext>(PanoramaContext)

export const PanoramaProvider = ({ children }: { children: ReactNode }) => {
    // 主题域分组缓存  {id : rootNode}
    const [groupNodeMap, setGroupNodeMap] = useState<Record<string, INode>>({})
    const [currentNode, setCurrentNode] = useState<INode>()
    const [activeId, setActiveId] = useState<string>('')
    const [shrink, setShrink] = useState<string>('')
    const [selectedCount, setSelectedCount] = useState<{
        id: string
        type: AssetNodes | string
        domainType: string
        domainName: string
    }>({
        id: '',
        type: '',
        domainType: '',
        domainName: '',
    })
    const [searchSelectedNodeId, setSearchSelectedNodeId] = useState<string>('')

    const optGroupNodeMap = (id: string, node: INode) => {
        setGroupNodeMap((prev) => ({
            ...prev,
            [id]: node,
        }))
    }

    const values = useMemo(
        () => ({
            currentNode,
            setCurrentNode,
            activeId,
            setActiveId,
            groupNodeMap,
            optGroupNodeMap,
            shrink,
            setShrink,
            selectedCount,
            setSelectedCount,
            searchSelectedNodeId,
            setSearchSelectedNodeId,
        }),
        [
            currentNode,
            setCurrentNode,
            activeId,
            setActiveId,
            groupNodeMap,
            optGroupNodeMap,
            shrink,
            setShrink,
            selectedCount,
            setSelectedCount,
            searchSelectedNodeId,
            setSearchSelectedNodeId,
        ],
    )
    return (
        <PanoramaContext.Provider value={values}>
            {children}
        </PanoramaContext.Provider>
    )
}
