import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { ISSZDDict, SSZDDictTypeEnum, formatError, getSSZDDict } from '@/core'
import __ from './locale'

type IResShareDrawerContext = {
    [key: string]: any
}

const ResShareDrawerContext = createContext<IResShareDrawerContext>({})

/**
 * 资源共享 drawer Provider
 */
export const useResShareDrawerContext = () =>
    useContext<IResShareDrawerContext>(ResShareDrawerContext)

export const ResShareDrawerProvider = ({
    children,
}: {
    children: ReactNode
}) => {
    // 字典数据
    const [dict, setDict] = useState<ISSZDDict>()

    useEffect(() => {
        getDict()
    }, [])

    // 获取字典
    const getDict = async () => {
        try {
            const res = await getSSZDDict([SSZDDictTypeEnum.UseScope])
            setDict(res)
        } catch (error) {
            formatError(error)
        }
    }
    const values = useMemo(() => ({ dict }), [dict])
    return (
        <ResShareDrawerContext.Provider value={values}>
            {children}
        </ResShareDrawerContext.Provider>
    )
}
