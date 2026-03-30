import { Breadcrumb } from 'antd'
import { useContext } from 'react'
import __ from './locale'
import { RouterStack, routerMap, removeQuery } from './RouterStack'

const BreadcrumbNav = () => {
    const { stack, navigateTo } = useContext(RouterStack)
    const pathSnippets = stack.slice(1)
    const breadcrumbNameMap = routerMap.reduce((acc, cur) => {
        acc[cur.key] = cur.label

        return acc
    }, {})

    const extraBreadcrumbItems = pathSnippets.map((key, index) => {
        const filteredKey = removeQuery(key)
        return (
            <Breadcrumb.Item
                key={breadcrumbNameMap[filteredKey]}
                onClick={() => {
                    navigateTo(index + 1)
                }}
            >
                {breadcrumbNameMap[filteredKey]}
            </Breadcrumb.Item>
        )
    })

    const breadcrumbItems = [
        <Breadcrumb.Item
            key="index"
            onClick={() => {
                navigateTo(0)
            }}
        >
            {__('单目录查询')}
        </Breadcrumb.Item>,
    ].concat(extraBreadcrumbItems)

    return <Breadcrumb>{breadcrumbItems}</Breadcrumb>
}

export default BreadcrumbNav
