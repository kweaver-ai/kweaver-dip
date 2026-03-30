import { ReactNode, createContext, useContext, useMemo, useState } from 'react'
import { getDatasheetViewDetails, getIndicatorDetail } from '@/core'

type MetaData = any

interface IIndicatorContext {
    getDataById: (id: string, type?: DataType) => any
}

const initContext: IIndicatorContext = {
    getDataById: (id: string, type?: DataType) => {},
}

export enum DataType {
    DataView,
    Indicator,
}

const IndicatorContext = createContext<IIndicatorContext>(initContext)

export const useIndicatorContext = () =>
    useContext<IIndicatorContext>(IndicatorContext)

export const IndicatorProvider = ({ children }: { children: ReactNode }) => {
    const [dataMap, setDataMap] = useState<MetaData>()
    const [atomMap, setAtomMap] = useState<MetaData>()
    const getDataById = async (id: string, type = DataType.DataView) => {
        if (type === DataType.Indicator) {
            let item = atomMap?.[id]
            if (!item && id) {
                item = await getIndicatorDetail(id)
                setAtomMap((prev) => ({
                    ...prev,
                    [id]: item,
                }))
            }

            return item
        }

        let item = dataMap?.[id]
        if (!item && id) {
            item = await getDatasheetViewDetails(id)
            setDataMap((prev) => ({
                ...prev,
                [id]: item,
            }))
        }

        return item
    }

    const values = useMemo(
        () => ({
            getDataById,
        }),
        [getDataById],
    )
    return (
        <IndicatorContext.Provider value={values}>
            {children}
        </IndicatorContext.Provider>
    )
}
