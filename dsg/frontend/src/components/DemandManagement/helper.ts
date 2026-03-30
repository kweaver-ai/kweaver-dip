export const getCurrentPath = (path: string) => {
    if (!path) return ''
    let ret = ''
    if (path?.includes('、')) {
        ret = path
            ?.split('、')
            ?.map((o) => o.split('/').pop())
            .filter((o) => !!o)
            .join('、')
    } else {
        ret = path.split('/').pop() ?? ''
    }

    return ret
}

// 获取父级路径
export const getParentDepartment = (path: string) => {
    const isHasSplit = path?.includes('/')
    const depart = isHasSplit
        ? getCurrentPath(path?.substring(0, path.lastIndexOf('/')))
        : ''
    return depart ? [{ department_name: depart }] : undefined
}

export const getDepartmentInfo = (arr: any[]) => {
    if (arr?.length > 0) {
        if (Array.isArray(arr[0])) {
            const deps: string[] = []
            const titleArr: string[] = []
            arr.forEach((depArr) => {
                const fullDepPath: string[] = []
                deps.push(depArr[depArr.length - 1].name)
                depArr?.forEach((dep) => {
                    fullDepPath.push(dep.name)
                })
                titleArr.push(fullDepPath.join('/'))
            })
            if (deps.length === 0) {
                return {
                    showName: '--',
                    title: '--',
                }
            }
            if (deps.length === 1) {
                return { showName: deps[0], title: titleArr.join('、') }
            }
            return {
                showName: deps.join('/'),
                title: titleArr.join('、'),
            }
        }

        const val =
            arr
                ?.map((o) => getCurrentPath(o?.department_name))
                .filter((o) => !!o)
                .join('、') ?? '--'
        return {
            showName: val,
            title: arr[0]?.department_name,
        }
    }
    return {
        showName: '--',
        title: '--',
    }
}
