import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useState,
} from 'react'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { getParentDepartment } from './helper'
import { VisitorTypeEnum } from './const'

type VisitorItem = any

interface IVisitorContext {
    currentId: string
    bindItems: VisitorItem[]
    setBindItems: Dispatch<SetStateAction<VisitorItem[]>>
    optBindItems: (type: OptionType, item: any) => void
}

export const VisitorContext = createContext<IVisitorContext>({
    currentId: '',
    bindItems: [],
    setBindItems: () => {},
    optBindItems: (type: OptionType, item: any) => {},
})

export const useVisitorContext = () =>
    useContext<IVisitorContext>(VisitorContext)

export enum OptionType {
    Add = 'add',
    Update = 'update',
    Remove = 'remove',
}

export const VisitorProvider = ({ children }: { children: ReactNode }) => {
    const currentId = useCurrentUser('ID')
    const [bindItems, setBindItems] = useState<VisitorItem[]>([])

    const optBindItems = (type: OptionType, item: any) => {
        let node = item
        if (type === OptionType.Add) {
            // 添加 item 为数组
            node = (item ?? []).map((o) => ({
                subject_id: o.id,
                subject_name: o.name,
                subject_type:
                    o.type === 'user'
                        ? VisitorTypeEnum.User
                        : VisitorTypeEnum.Department,
                departments:
                    o.type === 'user'
                        ? o?.parent_deps?.length > 0
                            ? o?.parent_deps
                            : o?.path
                                  ?.split('、')
                                  ?.map((n) => ({ department_name: n }))
                        : getParentDepartment(o.path),
                actions: [],
            }))
        }

        switch (type) {
            case OptionType.Add:
                setBindItems((prev) => [...node, ...(prev || [])])
                break
            case OptionType.Update:
                setBindItems(
                    bindItems?.map((o) =>
                        o.subject_id === node.subject_id ? node : o,
                    ),
                )
                break
            case OptionType.Remove:
                setBindItems(
                    bindItems?.filter((o) => o.subject_id !== node.subject_id),
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
        }),
        [currentId, bindItems, setBindItems, optBindItems],
    )
    return (
        <VisitorContext.Provider value={values}>
            {children}
        </VisitorContext.Provider>
    )
}
