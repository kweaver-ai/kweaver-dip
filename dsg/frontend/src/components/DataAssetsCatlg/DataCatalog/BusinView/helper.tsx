import { flattenDeep } from 'lodash'
import __ from './locale'
import { BusinNodeType } from './nodes/helper'
import { CatlgView } from '../../const'
import { IqueryInfoResCatlgItem, RelatedFieldType } from '@/core'

// 数据资源目录-业务视角-搜索默认类型
export const businViewSearchFieldsType = {
    [BusinNodeType.OrganizationView]: [
        RelatedFieldType.InfoCatlgName,
        RelatedFieldType.DataCatlgName,
        RelatedFieldType.BusinModelName,
        RelatedFieldType.MainBusinName,
        RelatedFieldType.DepartmentName,
        RelatedFieldType.LabelListRespName,
    ],
    [BusinNodeType.BusinDomainView]: [
        RelatedFieldType.InfoCatlgName,
        RelatedFieldType.DataCatlgName,
        RelatedFieldType.BusinModelName,
        RelatedFieldType.MainBusinName,
        RelatedFieldType.BusinDomainName,
        RelatedFieldType.LabelListRespName,
    ],
}

// 搜索-结果类型使用字段
export const businViewResTypeFields = {
    [BusinNodeType.OrganizationView]: [
        'main_business_departments',
        'main_business',
        'business_model',
        'name',
        'data_resource_catalogs',
    ],
    [BusinNodeType.BusinDomainView]: [
        'business_domain',
        'main_business',
        'business_model',
        'name',
        'data_resource_catalogs',
    ],
}

// 接口返回字段对应的节点类型
export const businViewResFieldToNodeTypeMap = {
    business_domain: BusinNodeType.BusinDomain,
    main_business: BusinNodeType.Process,
    business_model: BusinNodeType.BusinessModel,
    main_business_departments: BusinNodeType.Department,
    data_resource_catalogs: BusinNodeType.DataCatlg,
}

interface OriginalItem {
    id: string
    name: string
    main_business: Record<string, unknown>
    business_model: { id: string; name: string }
    main_business_departments: { id: string; name: string }[]
    data_resource_catalogs: { id: string; name: string }[]
}

interface ViewTreeNode {
    id: string
    name: string
    type?: BusinNodeType
    path_id?: string | Array<string>
    children?: ViewTreeNode[]
}

// export function convertToTree(data: any[]): ViewTreeNode[] {
//     const treeMap: Record<string, ViewTreeNode> = {}
//     const rootNodes: ViewTreeNode[] = []

//     // 处理单个部门数组，构建部门层级结构
//     function processDepartments(
//         main_business_departments: { id: string; name: string }[],
//         parentNode?: ViewTreeNode,
//     ) {
//         main_business_departments?.forEach((department, index) => {
//             if (!treeMap[department.id]) {
//                 treeMap[department.id] = {
//                     ...department,
//                     id: department.id,
//                     name: department.name,
//                     children: [],
//                 }
//             }

//             if (index === 0 && !parentNode) {
//                 // 第一个部门节点作为根节点
//                 rootNodes.push(treeMap[department.id])
//             } else if (parentNode) {
//                 // 将当前节点添加到父节点的子节点中
//                 parentNode.children?.push(treeMap[department.id])
//             }

//             // 递归处理下一个部门节点
//             if (index + 1 < main_business_departments.length) {
//                 processDepartments(
//                     main_business_departments.slice(index + 1) || [],
//                     treeMap[department.id],
//                 )
//             }
//         })
//     }

//     // 遍历原始数据
//     data?.forEach((item) => {
//         processDepartments(item.main_business_departments || [])

//         // 获取最后一个部门节点
//         const lastDepartmentIndex =
//             (item?.main_business_departments?.length || 0) - 1
//         if (lastDepartmentIndex >= 0) {
//             const lastDepartmentId =
//                 item.main_business_departments[lastDepartmentIndex].id
//             const lastDepartmentNode = treeMap[lastDepartmentId]

//             if (lastDepartmentNode) {
//                 // 处理第二级节点（main_business）
//                 const mainBusinessKey = `main_business_${item.id}`
//                 if (!treeMap[mainBusinessKey]) {
//                     treeMap[mainBusinessKey] = {
//                         id: mainBusinessKey,
//                         type: BusinNodeType.BusinDomain,
//                         name:
//                             Object.keys(item.main_business).length > 0
//                                 ? 'main_business'
//                                 : '空main_business',
//                         children: [],
//                     }
//                     lastDepartmentNode.children?.push(treeMap[mainBusinessKey])
//                 }

//                 // 处理第三级节点（business_model）
//                 const businessModelKey = item.business_model.id
//                 if (!treeMap[businessModelKey]) {
//                     treeMap[businessModelKey] = {
//                         id: businessModelKey,
//                         name: item.business_model.name,
//                         children: [],
//                         type: BusinNodeType.BusinessModel,
//                     }
//                     treeMap[mainBusinessKey].children?.push(
//                         treeMap[businessModelKey],
//                     )
//                 }

//                 // 处理第四级节点（信息资源目录的当前项的 id 和 name）
//                 const currentItemKey = item.id
//                 if (!treeMap[currentItemKey]) {
//                     treeMap[currentItemKey] = {
//                         ...item,
//                         children: [],
//                         type: BusinNodeType.InfoResourcesCatlg,
//                     }
//                     treeMap[businessModelKey].children?.push(
//                         treeMap[currentItemKey],
//                     )
//                 }

//                 // 处理第五级节点（data_resource_catalogs）
//                 item.data_resource_catalogs?.forEach((catalog) => {
//                     if (!treeMap[catalog.id]) {
//                         treeMap[catalog.id] = {
//                             id: catalog.id,
//                             name: catalog.name,
//                             type: BusinNodeType.DataCatlg,
//                         }
//                         treeMap[currentItemKey].children?.push(
//                             treeMap[catalog.id],
//                         )
//                     }
//                 })
//             }
//         }
//     })

//     return rootNodes
// }

interface DepartmentNode {
    id: string
    name?: string
    type: BusinNodeType
    path_name?: any[]
    children?: DepartmentNode[]
}

/**
 * 将列表数组中所有 main_business_departments 的部门节点构建成无重复节点的树，
 * 并按要求添加 main_business、business_model、item 以及 data_resource_catalogs 到对应层级
 * 同时为每级节点添加 path_name 属性，其值为所有祖先节点的 name 数组集合
 * @param items 包含相关字段的列表数组
 * @returns 构建好的完整树结构
 */
export function buildCompleteDepartmentTree(
    items: IqueryInfoResCatlgItem[],
): DepartmentNode[] {
    const nodeMap: Record<string, DepartmentNode> = {}
    const rootNodes: DepartmentNode[] = []

    // 遍历所有项，构建部门节点树
    items.forEach((item) => {
        const departments = item.main_business_departments || []
        let parentNode: DepartmentNode | undefined
        let currentPathName: string[] = []

        departments.forEach((department: any) => {
            const newPathName = [...currentPathName, department.name]
            if (!nodeMap[department.id]) {
                nodeMap[department.id] = {
                    id: department.id,
                    name: department.name,
                    type: BusinNodeType.Department,
                    path_name: newPathName,
                    children: [],
                }
            }

            if (!parentNode && departments.indexOf(department) === 0) {
                if (!rootNodes.some((node) => node.id === department.id)) {
                    rootNodes.push(nodeMap[department.id])
                }
            } else if (parentNode) {
                if (
                    !parentNode.children?.some(
                        (child) => child.id === department.id,
                    )
                ) {
                    parentNode.children?.push(nodeMap[department.id])
                }
            }

            parentNode = nodeMap[department.id]
            currentPathName = newPathName
        })

        // 将 main_business 作为 main_business_departments 最后一项的第一级子节点
        if (parentNode && item?.main_business?.id) {
            // const mainBusinessId = `main_business_${item.main_business.id}`
            const mainBusinessId = item.main_business.id || ''
            const newPathName = [
                ...(parentNode.path_name || []),
                item.main_business.name || '',
            ]
            if (mainBusinessId && !nodeMap[mainBusinessId]) {
                nodeMap[mainBusinessId] = {
                    id: mainBusinessId,
                    name: item.main_business.name || '',
                    type: BusinNodeType.Process,
                    path_name: newPathName,
                    children: [],
                }
            }
            if (
                !parentNode.children?.some(
                    (child) => child?.id === mainBusinessId,
                )
            ) {
                parentNode.children?.push(nodeMap[mainBusinessId])
            }
            parentNode = nodeMap[mainBusinessId]
        }

        // 将 business_model 作为第二级子节点
        if (parentNode && item.business_model) {
            // const businessModelId = `business_model_${item.business_model.id}`
            const businessModelId = item.business_model.id || ''
            const newPathName = [
                ...(parentNode.path_name || []),
                item.business_model.name,
            ]
            if (businessModelId && !nodeMap[businessModelId]) {
                nodeMap[businessModelId] = {
                    id: businessModelId,
                    name: item.business_model.name,
                    type: BusinNodeType.BusinessModel,
                    path_name: newPathName,
                    children: [],
                }
            }
            if (
                !parentNode.children?.some(
                    (child) => child.id === businessModelId,
                )
            ) {
                parentNode.children?.push(nodeMap[businessModelId])
            }
            parentNode = nodeMap[businessModelId]
        }

        // 将 item 作为第三级子节点
        if (parentNode) {
            // const itemId = `item_${JSON.stringify({
            //     id: item.main_business_departments?.map((d) => d.id).join('-'),
            // })}`
            const itemId = item.id
            const newPathName = [...(parentNode.path_name || []), item.name]
            if (!nodeMap[itemId]) {
                // 这里简单用一个标识作为名称，你可以根据实际需求修改
                nodeMap[itemId] = {
                    ...item,
                    type: BusinNodeType.InfoResourcesCatlg,
                    path_name: newPathName,
                    children: [],
                }
            }
            if (!parentNode.children?.some((child) => child.id === itemId)) {
                parentNode.children?.push(nodeMap[itemId])
            }
            parentNode = nodeMap[itemId]
        }

        // 将 data_resource_catalogs 数组字段作为最后一级子节点
        if (parentNode && item.data_resource_catalogs) {
            item.data_resource_catalogs.forEach((catalog) => {
                // const catalogId = `catalog_${catalog.id}`
                const catalogId = catalog.id || ''
                const newPathName = [
                    ...(parentNode?.path_name || []),
                    catalog.name,
                ]
                if (catalogId && !nodeMap[catalogId]) {
                    nodeMap[catalogId] = {
                        id: catalogId,
                        name: catalog.name,
                        type: BusinNodeType.DataCatlg,
                        path_name: newPathName,
                        children: [],
                    }
                }
                if (
                    !parentNode?.children?.some(
                        (child) => child.id === catalogId,
                    )
                ) {
                    parentNode?.children?.push(nodeMap[catalogId])
                }
            })
        }
    })

    return rootNodes
}

/**
 * 以 business_domain 为第一级节点，构建包含 main_business、business_model、当前 item 和 data_resource_catalogs 的树结构
 * @param items 包含相关字段的列表数组
 * @returns 构建好的以 business_domain 为第一级节点的树结构数组
 */
export function buildTreeWithBusinessDomain(
    items: IqueryInfoResCatlgItem[],
): DepartmentNode[] {
    const nodeMap: Record<string, DepartmentNode> = {}
    const businessDomainRootNodes: DepartmentNode[] = []

    items.forEach((item) => {
        // 处理 business_domain 节点
        if (item.business_domain && item.business_domain.id) {
            // const businessDomainId = `business_domain_${item.business_domain.id}`
            const businessDomainId = item.business_domain.id
            if (businessDomainId && !nodeMap[businessDomainId]) {
                nodeMap[businessDomainId] = {
                    id: businessDomainId,
                    name: item.business_domain.name || '',
                    type: BusinNodeType.BusinDomain,
                    children: [],
                }
                businessDomainRootNodes.push(nodeMap[businessDomainId])
            }

            let parentNode = nodeMap[businessDomainId]

            // 处理 main_business 节点
            if (item.main_business && item.main_business.id) {
                // const mainBusinessId = `main_business_${item.main_business.id}`
                const mainBusinessId = item.main_business.id

                if (mainBusinessId && !nodeMap[mainBusinessId]) {
                    nodeMap[mainBusinessId] = {
                        id: mainBusinessId,
                        name: item.main_business.name || '',
                        type: BusinNodeType.Process,
                        children: [],
                    }
                }
                if (
                    !parentNode.children?.some(
                        (child) => child.id === mainBusinessId,
                    )
                ) {
                    parentNode.children?.push(nodeMap[mainBusinessId])
                }
                parentNode = nodeMap[mainBusinessId]
            }

            // 处理 business_model 节点
            if (item.business_model && item.business_model.id) {
                // const businessModelId = `business_model_${item.business_model.id}`
                const businessModelId = item.business_model.id || ''
                if (businessModelId && !nodeMap[businessModelId]) {
                    nodeMap[businessModelId] = {
                        id: businessModelId,
                        name: item.business_model.name || '',
                        type: BusinNodeType.BusinessModel,
                        children: [],
                    }
                }
                if (
                    !parentNode.children?.some(
                        (child) => child.id === businessModelId,
                    )
                ) {
                    parentNode.children?.push(nodeMap[businessModelId])
                }
                parentNode = nodeMap[businessModelId]
            }

            // 处理当前 item 节点
            if (item.id) {
                // const itemId = `item_${item.id}`
                const itemId = item.id
                if (!nodeMap[itemId]) {
                    nodeMap[itemId] = {
                        ...item,
                        id: itemId,
                        name: item.name || '',
                        type: BusinNodeType.InfoResourcesCatlg,
                        children: [],
                    }
                }
                if (
                    !parentNode.children?.some((child) => child.id === itemId)
                ) {
                    parentNode.children?.push(nodeMap[itemId])
                }
                parentNode = nodeMap[itemId]
            }

            // 处理 data_resource_catalogs 节点
            if (item.data_resource_catalogs) {
                item.data_resource_catalogs.forEach((catalog) => {
                    if (catalog.id) {
                        // const catalogId = `catalog_${catalog.id}`
                        const catalogId = catalog.id

                        if (!nodeMap[catalogId]) {
                            nodeMap[catalogId] = {
                                id: catalogId,
                                name: catalog.name || '',
                                type: BusinNodeType.DataCatlg,
                                children: [],
                            }
                        }
                        if (
                            !parentNode.children?.some(
                                (child) => child.id === catalogId,
                            )
                        ) {
                            parentNode.children?.push(nodeMap[catalogId])
                        }
                    }
                })
            }
        }
    })

    return businessDomainRootNodes
}
