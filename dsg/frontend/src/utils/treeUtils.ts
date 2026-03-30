import { uniqBy } from 'lodash'

interface TreeNode {
    id: string
    name: string
    children?: TreeNode[]
}

interface SubjectInfoItem {
    path_id: string
    path_name: string
}

/**
 * 将 subject_info 列表转换为树结构
 * 把传入的节点组合成一棵树，但是其中有可能某个item是有path_id，但父节点不再这个列表中，这时需要解析path_id和path_name的父节点id和name在列表中加入这个父节点信息
 * @param subjectInfo - 包含 path_id 和 path_name 的列表
 * @level - 树的层级，默认为2即从L2开始生成， 若需要以L1最为祖宗节点，可传入1
 * @returns 树结构
 */
export const buildTreeFromSubjectInfo = (
    subjectInfo: SubjectInfoItem[],
    keys: any = {
        path_id: 'path_id',
        path_name: 'path_name',
    },
    level: number = 2,
): TreeNode[] => {
    const nodeMap = new Map<string, TreeNode>()
    const rootNodes: TreeNode[] = []
    const { path_id: pathIdKey, path_name: pathNameKey } = keys
    if (!subjectInfo?.length) {
        return rootNodes
    }
    // 补全缺失的父节点
    subjectInfo?.forEach((item) => {
        const pathIds = item?.[pathIdKey]?.split('/') || []
        const pathNames = item?.[pathNameKey]?.split('/') || []

        let parentNode: TreeNode | null = null
        for (let i = level - 1 || 0; i < pathIds.length; i += 1) {
            const id = pathIds[i]
            const name = pathNames[i]

            if (!nodeMap.has(id)) {
                const newNode: TreeNode = {
                    id,
                    name,
                    children: [],
                }
                nodeMap.set(id, newNode)

                if (parentNode) {
                    parentNode.children?.push(newNode)
                } else {
                    rootNodes.push(newNode)
                }
            }

            parentNode = nodeMap.get(id) || null
        }
    })

    return uniqBy(rootNodes, 'id')
}
