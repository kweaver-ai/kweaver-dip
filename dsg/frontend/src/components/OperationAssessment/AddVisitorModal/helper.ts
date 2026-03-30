export interface DepartInfoItem {
    department_id: string
    department_name: string
}

/**
 * 根据部门二维数组查询标题和提示语
 */
export const getDepartLabelByDepartments = (
    departments: DepartInfoItem[][],
) => {
    const title = departments
        ?.reduce((prev: string[], cur: DepartInfoItem[]) => {
            const superiorName = cur?.[cur.length - 1]?.department_name
            return prev.concat(superiorName)
        }, [])
        .join('、')
    const tip = departments
        ?.reduce((prev: string[], cur: DepartInfoItem[]) => {
            const superiorsNamePath = cur
                ?.map((o) => o.department_name)
                .join('/')
            return prev.concat(superiorsNamePath)
        }, [])
        .join('、')

    return { title, tip }
}
