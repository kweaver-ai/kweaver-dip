import React, {
    ReactNode,
    createContext,
    useContext,
    useMemo,
    useState,
    Dispatch,
    SetStateAction,
} from 'react'

type DirTreeNode = any

interface IDirTreeContext {
    currentNode: DirTreeNode
    currentMenu: DirTreeNode
    optNode: DirTreeNode
    setCurrentNode: Dispatch<SetStateAction<DirTreeNode>>
    setCurrentMenu: Dispatch<SetStateAction<DirTreeNode>>
    setOptNode: Dispatch<SetStateAction<DirTreeNode>>
}

export const DirTreeContext = createContext<IDirTreeContext>({
    currentNode: null,
    currentMenu: null,
    setCurrentNode: () => {},
    setCurrentMenu: () => {},
    optNode: null,
    setOptNode: () => {},
})

export const useDirTreeContext = () =>
    useContext<IDirTreeContext>(DirTreeContext)

export const DirTreeProvider = ({ children }: { children: ReactNode }) => {
    const [currentNode, setCurrentNode] = useState<DirTreeNode>()
    const [currentMenu, setCurrentMenu] = useState<DirTreeNode>()
    const [optNode, setOptNode] = useState<DirTreeNode>()
    const values = useMemo(
        () => ({
            currentNode,
            setCurrentNode,
            currentMenu,
            setCurrentMenu,
            optNode,
            setOptNode,
        }),
        [
            currentNode,
            setCurrentNode,
            currentMenu,
            setCurrentMenu,
            optNode,
            setOptNode,
        ],
    )
    return (
        <DirTreeContext.Provider value={values}>
            {children}
        </DirTreeContext.Provider>
    )
}
