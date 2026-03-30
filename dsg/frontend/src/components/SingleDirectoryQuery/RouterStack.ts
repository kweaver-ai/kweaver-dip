import { createContext, useContext, useMemo, useState } from 'react'
import SingleDirectoryQueryPage from '@/pages/singleDirectoryQuery/SingleDirectoryQueryPage'
import TemplateManagePage from '@/pages/singleDirectoryQuery/TemplateManagePage'
import HistoryRecordPage from '@/pages/singleDirectoryQuery/HistoryRecordPage'
import __ from './locale'

interface RouterStackOpts {
    stack: string[]
    currentPath: string
    push: (name: string) => void
    navigateTo: (index: number) => void
}

// 模拟路由栈配置
export const RouterStack = createContext<RouterStackOpts>({
    stack: [],
    currentPath: '',
    push: () => {},
    navigateTo: () => {},
})

export const HOMEPATH = 'singleDirectoryQuery'

// 设置模拟路由映射配置
export const routerMap = [
    {
        key: HOMEPATH,
        element: SingleDirectoryQueryPage,
        label: __('单目录模板'),
    },
    {
        key: 'templateManage',
        element: TemplateManagePage,
        label: __('模板管理'),
    },
    {
        key: 'historyRecord',
        element: HistoryRecordPage,
        label: __('历史记录'),
    },
    {
        key: 'importQueryCondition',
        element: SingleDirectoryQueryPage,
        label: __('导入查询条件'),
    },
    {
        key: 'createSingleDirectory',
        element: SingleDirectoryQueryPage,
        label: __('新建单目录查询'),
    },
    {
        key: 'editSingleDirectory',
        element: SingleDirectoryQueryPage,
        label: __('编辑单目录查询'),
    },
    {
        key: 'importQueryCondition',
        element: SingleDirectoryQueryPage,
        label: __('导入查询条件'),
    },
]

// 移除查询参数
export const removeQuery = (url: string) => {
    const index = url.indexOf('?')

    if (index < 0) return url

    return url.slice(0, index)
}

// 获取查询参数
export const useQueryParams = () => {
    const { currentPath } = useContext(RouterStack)

    const queryObj = useMemo(() => {
        const fragment = currentPath.split('?')

        if (fragment.length > 1) {
            return fragment[1].split('&').reduce((acc, cur) => {
                const queryFragment = cur.split('=')

                if (queryFragment.length > 1) {
                    acc.set(queryFragment[0], queryFragment[1])
                }

                return acc
            }, new Map())
        }

        return new Map()
    }, [currentPath])

    return queryObj
}

// 管理路由入栈出栈
export const useRouteStack = (indexRouter: string = HOMEPATH) => {
    const [stack, setStack] = useState<string[]>([indexRouter])

    const currentPath = stack[stack.length - 1]

    const current =
        // 移除查询参数之后再去匹配对应的路由
        routerMap.find((item) => removeQuery(item.key) === currentPath)
            ?.element ?? routerMap[0].element

    const push = (router: string) => {
        setStack((prev) => {
            const newStack = [...prev]
            newStack.push(router)
            return newStack
        })
    }

    const pop = () => {
        setStack((prev) => {
            const newStack = [...prev]
            newStack.pop()
            return newStack
        })
    }

    const navigateTo = (index: number) => {
        setStack((prev) => {
            return prev.slice(0, index + 1)
        })
    }

    return { current, currentPath, stack, push, pop, navigateTo }
}

// 获取模拟路由信息
export const useRouter = () => useContext(RouterStack)
