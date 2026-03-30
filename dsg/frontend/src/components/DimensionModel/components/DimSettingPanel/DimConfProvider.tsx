import { isEqual } from 'lodash'
import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'

type IDimConfContext = {
    dimConf?: any[]
    setDimConf: (item: any) => void
    fieldArr?: any[]
    setFieldArr: (item: any) => void
    optDimConf: (opt: OptDimType, item: any, id?: string) => void
    factConf: any
    setFactConf: (item: any) => void
    error: any
    setError: (item: any) => void
    isDimChanged: boolean
    setLastDimConfig: Dispatch<SetStateAction<any>>
}

const DimConfContext = createContext<IDimConfContext>({
    dimConf: [],
    setDimConf: () => {},
    fieldArr: [],
    setFieldArr: () => {},
    optDimConf: () => {},
    factConf: {},
    setFactConf: () => {},
    error: { fact: undefined, dimension: undefined },
    setError: () => {},
    isDimChanged: false,
    setLastDimConfig: () => {},
})

export const useDimConfContext = () =>
    useContext<IDimConfContext>(DimConfContext)

export enum OptDimType {
    ADD,
    UPDATE,
    DELETE,
}

export const DimConfProvider = ({ children }: { children: ReactNode }) => {
    const [factConf, setFactConf] = useState<any>()
    const [dimConf, setDimConf] = useState<any[]>()
    const [lastDimConfig, setLastDimConfig] = useState<any>()
    const [fieldArr, setFieldArr] = useState<any[]>()
    const [error, setError] = useState<any>({
        fact: undefined,
        dimension: undefined,
    })

    const isDimChanged = useMemo(() => {
        if (!factConf && !dimConf && !lastDimConfig) return false
        return !isEqual({ factConf, dimConf }, lastDimConfig)
    }, [dimConf, factConf, lastDimConfig])

    // fact 切换 清空 维度关联
    const validateItemsError = (items: any[]) => {
        const factFieldIds = items?.map((o) => o.factFieldId)
        const err = (error?.dimension?.errors || []).filter(
            (o) => !factFieldIds?.includes(o.factFieldId),
        )
        if (err?.length !== error?.length) {
            setError((prev) => ({
                ...prev.fact,
                dimension: {
                    ...prev.dimension,
                    errors: err,
                },
            }))
        }
    }

    // 对维度表配置的操作
    const optDimConf = useCallback(
        (opt: OptDimType, item: any, factFieldId?: string) => {
            switch (opt) {
                case OptDimType.ADD:
                    setDimConf((prev) => [
                        ...(prev || []),
                        ...(Array.isArray(item) ? item : [item]),
                    ])
                    break
                // 更新只能单个操作
                case OptDimType.UPDATE:
                    if (!factFieldId) return
                    setDimConf((prev) =>
                        prev?.map((o) => {
                            if (o.factFieldId === factFieldId) {
                                return {
                                    ...o,
                                    ...item,
                                }
                            }
                            return o
                        }),
                    )
                    break
                default:
                    setDimConf((prev) =>
                        prev?.filter(
                            (o) =>
                                !(Array.isArray(item) ? item : [item])?.some(
                                    (it) => it.factFieldId === o.factFieldId,
                                ),
                        ),
                    )

                    validateItemsError(Array.isArray(item) ? item : [item])
                    break
            }
        },
        [dimConf, error],
    )

    const values = useMemo(
        () => ({
            dimConf,
            setDimConf,
            optDimConf,
            factConf,
            setFactConf,
            error,
            setError,
            fieldArr,
            setFieldArr,
            isDimChanged,
            setLastDimConfig,
            validateItemsError,
        }),
        [
            dimConf,
            setDimConf,
            optDimConf,
            factConf,
            setFactConf,
            error,
            setError,
            fieldArr,
            setFieldArr,
            isDimChanged,
            setLastDimConfig,
            validateItemsError,
        ],
    )
    return (
        <DimConfContext.Provider value={values}>
            {children}
        </DimConfContext.Provider>
    )
}
