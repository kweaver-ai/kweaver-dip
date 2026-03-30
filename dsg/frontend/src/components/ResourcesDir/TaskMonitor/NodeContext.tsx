import { createContext, useContext } from 'react'

interface NodeContextType {
    onShowQualityReport: () => void
    updateActiveKey?: (key: any) => void
}

export const NodeContext = createContext<NodeContextType>({
    onShowQualityReport: () => {},
    updateActiveKey: () => {},
})

export const useNodeContext = () => useContext(NodeContext)
