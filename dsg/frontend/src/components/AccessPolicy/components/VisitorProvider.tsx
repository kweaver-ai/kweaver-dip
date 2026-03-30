import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'
import { useGetState } from 'ahooks'
import { AssetTypeEnum, VisitorTypeEnum } from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'

type VisitorItem = any

interface IVisitorContext {
    currentId: string
    bindItems: VisitorItem[]
    setBindItems: Dispatch<SetStateAction<VisitorItem[]>>
    checkMe: boolean
    setCheckMe: Dispatch<SetStateAction<boolean>>
    optBindItems: (type: OptionType, item: any, isSuffix?: boolean) => void
}

export const VisitorContext = createContext<IVisitorContext>({
    currentId: '',
    bindItems: [],
    checkMe: true,
    setCheckMe: () => {},
    setBindItems: () => {},
    optBindItems: (type: OptionType, item: any, isSuffix?: boolean) => {},
})

export const useVisitorContext = () =>
    useContext<IVisitorContext>(VisitorContext)

export enum OptionType {
    Add = 'add',
    Update = 'update',
    Remove = 'remove',
    BatchUpdate = 'batch_update',
}

const getDefaultPermissions = (type?: AssetTypeEnum, subject_type?: string) => {
    if (!type) {
        // 未配置 默认返回 读取
        return [
            {
                action: 'read',
                effect: 'allow',
            },
        ]
    }

    switch (type) {
        case AssetTypeEnum.SubService:
        case AssetTypeEnum.Api:
            return subject_type === VisitorTypeEnum.App
                ? [
                      {
                          action: 'read',
                          effect: 'allow',
                      },
                  ]
                : [
                      {
                          action: 'auth',
                          effect: 'allow',
                      },
                  ]
        default:
            return [
                {
                    action: 'read',
                    effect: 'allow',
                },
            ]
    }
}
export const VisitorProvider = ({
    viewType,
    children,
}: {
    viewType?: AssetTypeEnum
    children: ReactNode
}) => {
    const [currentId] = useCurrentUser('ID')
    // 资源授权仅Owner能查看，即自身不可选，权限申请
    const [checkMe, setCheckMe] = useState<boolean>(false)
    const [bindItems, setBindItems, getBindItems] = useGetState<VisitorItem[]>(
        [],
    )

    const optBindItems = (type: OptionType, item: any, isSuffix = false) => {
        let node = item
        if (type === OptionType.Add) {
            // 添加 item 为数组
            node = (item ?? []).map((o) => ({
                subject_id: o.id,
                subject_name: o.name,
                subject_type:
                    o.type === 'user'
                        ? VisitorTypeEnum.User
                        : o.type === 'app'
                        ? VisitorTypeEnum.App
                        : VisitorTypeEnum.Department,
                departments: o?.parent_deps,
                // 默认 查看/读取
                permissions: getDefaultPermissions(viewType, o.type),
                expired_at: undefined,
            }))
        }

        switch (type) {
            case OptionType.Add:
                setBindItems((prev) =>
                    isSuffix ? [...prev, ...node] : [...node, ...prev],
                )
                break
            case OptionType.Update:
                setBindItems(
                    getBindItems()?.map((o) =>
                        o.subject_id === node.subject_id ? node : o,
                    ),
                )
                break
            case OptionType.BatchUpdate:
                setBindItems(
                    getBindItems()?.map((o) => {
                        const newItem = (item ?? [])?.find(
                            (i) => i.subject_id === o.subject_id,
                        )
                        return newItem ? { ...o, ...newItem } : o
                    }),
                )
                break
            case OptionType.Remove:
                setBindItems(
                    getBindItems()?.filter(
                        (o) => o.subject_id !== node.subject_id,
                    ),
                )
                break
            default:
                break
        }
    }

    const values = useMemo(
        () => ({
            currentId,
            bindItems,
            setBindItems,
            optBindItems,
            checkMe,
            setCheckMe,
        }),
        [currentId, bindItems, setBindItems, optBindItems, checkMe, setCheckMe],
    )
    return (
        <VisitorContext.Provider value={values}>
            {children}
        </VisitorContext.Provider>
    )
}
