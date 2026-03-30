import {
    ReactNode,
    createContext,
    useContext,
    useMemo,
    useState,
    Dispatch,
    SetStateAction,
} from 'react'
import { useSetState } from 'ahooks'
import { MenuInfo } from 'rc-menu/lib/interface'
import { CatalogOption, CatalogType, IDirItem } from '@/core'
import { MoreOperate } from './const'

type DirTreeNode = any

type NodeOptType = {
    moreAccess: boolean
    optMenuItems: Array<MoreOperate>
    moreOptMenus: (key: string) => any[]
    handleClickMenu: (e: MenuInfo, item: IDirItem) => void
    selCatlgClass: CatalogOption
    dirType: CatalogType
}

interface IDirTreeContext {
    currentNode: DirTreeNode
    currentMenu: DirTreeNode
    optNode: DirTreeNode
    nodeOpt: Partial<NodeOptType>
    setCurrentNode: Dispatch<SetStateAction<DirTreeNode>>
    setCurrentMenu: Dispatch<SetStateAction<DirTreeNode>>
    setOptNode: Dispatch<SetStateAction<DirTreeNode>>
    setNodeOpt: Dispatch<SetStateAction<Partial<NodeOptType>>>
}

export const DirTreeContext = createContext<IDirTreeContext>({
    currentNode: null,
    currentMenu: null,
    nodeOpt: {},
    setCurrentNode: () => {},
    setCurrentMenu: () => {},
    setNodeOpt: () => {},
    optNode: null,
    setOptNode: () => {},
})

export const useDirTreeContext = () =>
    useContext<IDirTreeContext>(DirTreeContext)

export const DirTreeProvider = ({ children }: { children: ReactNode }) => {
    const [currentNode, setCurrentNode] = useState<DirTreeNode>()
    const [currentMenu, setCurrentMenu] = useState<DirTreeNode>()
    const [optNode, setOptNode] = useState<DirTreeNode>() // 操作按钮
    const [nodeOpt, setNodeOpt] = useState<Partial<NodeOptType>>({}) // 节点方法
    const values = useMemo(
        () => ({
            currentNode,
            setCurrentNode,
            currentMenu,
            setCurrentMenu,
            optNode,
            setOptNode,
            nodeOpt,
            setNodeOpt,
        }),
        [
            currentNode,
            setCurrentNode,
            currentMenu,
            setCurrentMenu,
            optNode,
            setOptNode,
            nodeOpt,
            setNodeOpt,
        ],
    )
    return (
        <DirTreeContext.Provider value={values}>
            {children}
        </DirTreeContext.Provider>
    )
}
