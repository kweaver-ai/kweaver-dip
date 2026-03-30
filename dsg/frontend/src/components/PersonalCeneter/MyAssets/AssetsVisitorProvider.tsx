import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { noop } from 'lodash'
import { AssetVisitorTypes } from './const'
import { allRoleList, formatError, HasAccess } from '@/core'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

/**
 * 定义了一个资产访问者上下文接口，用于管理当前选择的资产信息和类型
 */
interface IAssetsVisitorContext {
    /**
     * 当前选择的资产ID，可能未定义，表示没有资产被选中
     */
    selectedId: string | undefined

    /**
     * 当前选择的资产类型，由枚举类型AssetVisitorTypes定义
     */
    selectedType: AssetVisitorTypes

    /**
     * 更新当前选择的资产ID
     * @param id 新的资产ID
     */
    updateSelectedId: (id: string | undefined) => void

    /**
     * 更新当前选择的资产类型
     * @param type 新的资产类型，由枚举类型AssetVisitorTypes定义
     */
    updateSelectedType: (type: AssetVisitorTypes) => void
    /**
     * isVisitor: 用于标识用户是否为访问者的布尔类型属性。
     * 如果值为true，表示当前用户为访问者；否则表示用户不是访问者。
     */
    isVisitor: boolean

    /**
     * isAppDeveloper: 用于标识用户是否为应用开发者的布尔类型属性。
     * 如果值为true，表示当前用户为应用开发者；否则表示用户不是应用开发者。
     */
    isAppDeveloper: boolean

    /**
     * isDataOwner: 用于标识用户是否为数据所有者的布尔类型属性。
     * 如果值为true，表示当前用户为数据所有者；否则表示用户不是数据所有者。
     */
    isDataOwner: boolean

    isSystem: boolean
}

// 定义一个名为AssetsVisitorContext的上下文对象，用于在组件树中传递资产访问者的信息
// 该上下文对象初始值包含未定义的selectedId，selectedType默认为USER类型，
// 以及两个无操作函数updateSelectedId和updateSelectedType，用于更新selectedId和selectedType
export const AssetsVisitorContext = createContext<IAssetsVisitorContext>({
    selectedId: undefined,
    selectedType: AssetVisitorTypes.USER,
    updateSelectedId: noop,
    updateSelectedType: noop,
    isVisitor: true,
    isAppDeveloper: false,
    isDataOwner: true,
    isSystem: true,
})

/**
 * 使用资产上下文钩子
 *
 * 该钩子用于从 AssetsVisitorContext 中获取资产上下文
 * 主要用于在组件内部访问和操作资产相关数据
 *
 * @returns {IAssetsVisitorContext} 返回资产上下文接口
 */
export const useAssetsContext = () =>
    useContext<IAssetsVisitorContext>(AssetsVisitorContext)

/**
 * 提供一个管理资产访问者的上下文
 * 该组件用于封装资产访问者相关的信息，并使其能在组件树中方便地访问
 * @param {ReactNode} children - 要渲染的子组件
 * @returns {JSX.Element} - 包含了上下文提供者的元素
 */
export const AssetsVisitorProvider = ({
    children,
}: {
    children: ReactNode
}) => {
    // 用于存储当前选中的访问者ID，初始值为undefined
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined)
    // 用于存储当前选中的访问者类型，初始值为USER
    const [selectedType, setSelectedType] = useState<AssetVisitorTypes>(
        AssetVisitorTypes.None,
    )
    const [isAppDeveloper, setIsAppDeveloper] = useState<boolean>(false)
    const [isSystem, setIsSystem] = useState<boolean>(false)
    const [isVisitor, setIsVisitor] = useState<boolean>(false)
    const [isDataOwner, setIsDataOwner] = useState<boolean>(false)
    const { checkPermission, checkPermissions } = useUserPermCtx()

    useEffect(() => {
        checkCurrentUserIsSystemManager()
    }, [checkPermission])
    /**
     * 异步函数checkCurrentUserIsSystemManager用于检查当前用户是否是系统管理员
     * 该函数通过获取当前用户的角色信息，并查找其中是否包含特定的系统管理员角色来实现判断
     * 最终通过调用setIsSystemManager来更新系统管理员状态
     */
    const checkCurrentUserIsSystemManager = () => {
        try {
            // 获取当前用户的角色信息
            const hasResourceAccess =
                checkPermissions(HasAccess.isHasBusiness) ?? false
            setIsAppDeveloper(
                checkPermission(allRoleList.ApplicationDeveloper) ?? false,
            )
            setIsSystem(checkPermission(allRoleList.TCSystemMgm) ?? false)
            setIsDataOwner(checkPermission(allRoleList.TCDataOwner) ?? false)
            setIsVisitor(hasResourceAccess)
        } catch (err) {
            // 对错误进行格式化处理
            formatError(err)
        }
    }

    // 使用useMemo来缓存值对象，只有当selectedId或selectedType变化时才会重新计算
    // 这样做是为了提升性能，避免不必要的重新渲染
    const values = useMemo(
        () => ({
            selectedId,
            selectedType,
            // 提供更新selectedId的方法
            updateSelectedId: setSelectedId,
            // 提供更新selectedType的方法
            updateSelectedType: setSelectedType,
            isVisitor,
            isAppDeveloper,
            isSystem,
            isDataOwner,
        }),
        [
            selectedId,
            selectedType,
            isVisitor,
            isSystem,
            isDataOwner,
            isAppDeveloper,
        ],
    )
    // 返回一个上下文提供者组件，将values作为上下文值
    // 所有子组件都可以访问到这个上下文值
    return (
        <AssetsVisitorContext.Provider value={values}>
            {children}
        </AssetsVisitorContext.Provider>
    )
}
