import React, {
    createContext,
    useContext,
    useMemo,
    useState,
    ReactNode,
} from 'react'
import PropTypes from 'prop-types'
/** 按钮级权限Action */
export type MenuAction =
    | 'create'
    | 'update'
    | 'read'
    | 'delete'
    | 'import'
    | 'offline'

export interface MenuItem {
    key: string
    label?: string
    path?: string
    element?: string
    layoutElement?: string
    module?: string[]
    belong?: string[]
    attribute?: {
        iconFont?: string
    }
    children?: MenuItem[]
    actions?: MenuAction[]
    type?: 'module' | 'group'
    hide?: boolean
    index?: boolean
    isDeveloping?: boolean
}

interface AccessIndex {
    /** 所有可访问的页面 key */
    pageKeys: Set<string>
    /** 按 key 索引的 actions */
    actionsByKey: Map<string, Set<MenuAction>>
    /** 按 key 索引的节点 */
    nodesByKey: Map<string, MenuItem>
    /** 按 module 索引的节点 */
    nodesByModule: Map<string, MenuItem[]>
}

interface MenuContextType {
    /** 菜单数据 */
    menus: MenuItem[]
    /** 是否正在加载 */
    loading: boolean
    /** 权限索引 */
    accessIndex: AccessIndex
    /** 设置菜单 */
    setMenus: (menus: MenuItem[]) => void
    /** 设置加载状态 */
    setLoading: (loading: boolean) => void
}

const MenuContext = createContext<MenuContextType>({
    menus: [],
    loading: true,
    accessIndex: {
        pageKeys: new Set(),
        actionsByKey: new Map(),
        nodesByKey: new Map(),
        nodesByModule: new Map(),
    },
    setMenus: () => {},
    setLoading: () => {},
})

/**
 * 构建权限索引
 */
const buildAccessIndex = (menus: MenuItem[]): AccessIndex => {
    const pageKeys = new Set<string>()
    const actionsByKey = new Map<string, Set<MenuAction>>()
    const nodesByKey = new Map<string, MenuItem>()
    const nodesByModule = new Map<string, MenuItem[]>()

    const traverse = (items: MenuItem[]) => {
        items.forEach((item) => {
            // 按 key 索引
            nodesByKey.set(item.key, item)

            // 按 module 索引
            if (item.module) {
                item.module.forEach((mod) => {
                    if (!nodesByModule.has(mod)) {
                        nodesByModule.set(mod, [])
                    }
                    nodesByModule.get(mod)!.push(item)
                })
            }

            // 索引 actions
            if (item.actions && item.actions.length > 0) {
                actionsByKey.set(item.key, new Set(item.actions))
            }

            // 页面访问权限（非隐藏、非分组类型）
            if (!item.hide && item.type !== 'group') {
                pageKeys.add(item.key)
            }

            // 递归处理子菜单
            if (item.children && item.children.length > 0) {
                traverse(item.children)
            }
        })
    }

    traverse(menus)

    return {
        pageKeys,
        actionsByKey,
        nodesByKey,
        nodesByModule,
    }
}

export const MenuProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [menus, setMenus] = useState<MenuItem[]>([])
    const [loading, setLoading] = useState(true)

    const accessIndex = useMemo(() => buildAccessIndex(menus), [menus])

    const value = useMemo(
        () => ({
            menus,
            loading,
            accessIndex,
            setMenus,
            setLoading,
        }),
        [menus, loading, accessIndex],
    )

    return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

MenuProvider.propTypes = {
    children: PropTypes.node.isRequired,
}

export const useMenu = () => {
    const context = useContext(MenuContext)
    if (!context) {
        throw new Error('useMenu must be used within MenuProvider')
    }
    return context
}

export default MenuProvider
