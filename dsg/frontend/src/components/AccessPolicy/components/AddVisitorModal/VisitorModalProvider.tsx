import { ReactNode, createContext, useContext, useMemo, useState } from 'react'

type VisitorItem = any

interface IVisitorModalContext {
    items: VisitorItem[]
    clearItems: () => void
    optItem: (type: OptionType, item: any) => void
}

export const VisitorModalContext = createContext<IVisitorModalContext>({
    items: [],
    clearItems: () => {},
    optItem: (type: OptionType, item: any) => {},
})

export const useVisitorModalContext = () =>
    useContext<IVisitorModalContext>(VisitorModalContext)

export enum OptionType {
    Add = 'add',
    Remove = 'remove',
}

export const VisitorModalProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<VisitorItem[]>([])

    const optItem = (type: OptionType, item: any) => {
        switch (type) {
            case OptionType.Add:
                if (!items?.some((o) => o.id === item.id)) {
                    setItems((prev) => [...prev, item])
                }
                break
            case OptionType.Remove:
                setItems(items?.filter((o) => o.id !== item))
                break
            default:
                break
        }
    }

    const clearItems = () => {
        setItems([])
    }

    const values = useMemo(
        () => ({
            items,
            clearItems,
            optItem,
        }),
        [items, clearItems, optItem],
    )
    return (
        <VisitorModalContext.Provider value={values}>
            {children}
        </VisitorModalContext.Provider>
    )
}
