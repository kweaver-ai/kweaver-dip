import React, {
    ReactNode,
    createContext,
    useContext,
    useMemo,
    useState,
    Dispatch,
    SetStateAction,
    useEffect,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { getInnerUrl } from '@/utils'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const getRegexp = (fullPath: string) => {
    const parts = fullPath.split('/').slice(1)
    const len = parts.length
    let str = '^'
    for (let i = 0; i < len; i += 1) {
        if (parts[i][0] === ':') {
            str += `(?:\\/(?<${parts[i].slice(1)}>[^\\/#\\?]+?))`
        } else if (parts[i][0] === '*') {
            str += '\\/.*'
        } else {
            str += `\\/${parts[i]}`
        }
    }
    return new RegExp(`${str}[\\/#\\?]?$`)
}

/**
 * 平铺路由
 * @param routeTree 路由树
 * @param accumulate 是否path累计
 * @param preffix 前缀
 * @returns
 */
const flatRoute = (
    routeTree: Array<Record<string, any>>,
    accumulate?: boolean,
    preffix = '',
) =>
    routeTree.reduce((prev: any[], route) => {
        const { children, ...rest } = route
        const path = rest?.path
            ? rest?.path?.startsWith('/')
                ? rest.path
                : `/${rest.path}`
            : ''

        let childs: any[] = []
        if (children?.length) {
            const preffixStr = !accumulate ? '' : `${preffix}${path}`
            childs = flatRoute(children, accumulate, preffixStr)
        }
        return [...prev, { ...rest, path: `${preffix}${path}` }, ...childs]
    }, [])

/**
 * 格式化路由
 * @param routeArr
 * @returns
 */
const formatRoute = (routeArr: Array<Record<string, any>>) =>
    (routeArr ?? [])
        .filter((o) => (o.label || o?.domTitle) && o.path)
        .map(({ label, path, domTitle }: any) => ({ label, path, domTitle }))

interface IDocumentTitleContext {
    currentPath: string
    setCurrentPath: Dispatch<SetStateAction<string>>
    menusData: any[]
    setMenusData: Dispatch<SetStateAction<any[]>>
}

export const DocumentTitleContext = createContext<IDocumentTitleContext>({
    currentPath: '',
    setCurrentPath: () => {},
    menusData: [],
    setMenusData: () => {},
})

export const useDocumentTitleContext = () =>
    useContext<IDocumentTitleContext>(DocumentTitleContext)

export const DocumentTitleProvider = ({
    children,
}: {
    children: ReactNode
}) => {
    const [menusData, setMenusData] = useState<any[]>([])
    const [currentPath, setCurrentPath] = useState<string>('')
    const [menusItems, setMenusItems] = useState<Record<string, any>[]>()
    const [searchParams] = useSearchParams()
    const [{ cssjj }] = useGeneralConfig()

    useEffect(() => {
        const TAG = ''
        let path = getInnerUrl(currentPath)

        if (path?.endsWith('/')) {
            path = path.slice(0, -1)
        }
        // 公用页特殊处理 判定参数是否包含taskId
        const isSpecialPath = [
            '/formGraph/',
            '/drawio',
            '/dataService/dataCatalogUndsContent',
            '/dataUnderstandingContent',
            '/dataComprehensionContent',
        ].some((o) => path?.indexOf(o) > -1)
        if (isSpecialPath && searchParams?.get('taskId')) {
            // 我的任务
            path = '/taskCenter/task'
        }
        const route = menusItems?.find((o) => {
            if (o.path?.indexOf(':') >= 0) {
                const reg = getRegexp(o.path)
                return reg.test(path)
            }
            return o.path === path
        })
        document.title =
            route?.label || route?.domTitle
                ? `${route?.domTitle || route?.label}${TAG ? ` - ${TAG}` : ''}`
                : TAG
    }, [currentPath, menusItems, cssjj])

    useEffect(() => {
        const AnyFabricRoutes = formatRoute(flatRoute(menusData, true))
        const combineMenu = [...AnyFabricRoutes]
        setMenusItems(combineMenu)
    }, [menusData])

    const values = useMemo(
        () => ({
            currentPath,
            setCurrentPath,
            menusData,
            setMenusData,
        }),
        [currentPath, setCurrentPath],
    )
    return (
        <DocumentTitleContext.Provider value={values}>
            {children}
        </DocumentTitleContext.Provider>
    )
}
