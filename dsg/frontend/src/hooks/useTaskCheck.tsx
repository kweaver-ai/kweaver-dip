import { useCallback, useMemo } from 'react'
import { andBinArr, equalBinArr, plusBinArr, toBinArr } from './helper'
import { TaskExecutableStatus, TaskType } from '@/core'

/**
 * 任务分类集
 */
const variations = [
    {
        name: 'task',
        values: [...Object.values(TaskType), 'none'],
    },
]

export interface ITaskProduct {
    operate: string[]
    task: string
}

/**
 * (任务下)各模块操作检查
 * @operates 操作集,不要与任务类型有重合
 * @products 场景集
 * @taskInfo 任务相关信息
 */
export const useTaskCheck = (
    operates: string[],
    products: ITaskProduct[],
    taskInfo?: any,
) => {
    /**
     * 所有分类的值的二进制集
     * { 'module-form': 1, 'module-flowchart': 2, 'module-indicator': 4, ... }
     */
    const veriationTypeMap = useMemo(() => {
        let power = 1
        return [
            ...variations,
            {
                name: 'operate',
                values: operates,
            },
        ].reduce((acc, variation) => {
            variation.values.forEach((value) => {
                const key = `${variation.name}-${value}`
                if (!acc[key]) {
                    acc[key] = toBinArr(power)
                    power += 1
                }
            })
            return acc
        }, {})
    }, [operates])

    /**
     * 分情况下的总值的数组集
     * @param isTask 是否在任务下
     * @returns 二进制数组集
     */
    const variationBinaryValues = useMemo(() => {
        const data = products.map((prod) => [
            {
                name: 'operate',
                values: prod.operate,
            },
            { name: 'task', values: prod.task },
        ])
        return data.map((prod) => {
            // 筛出组合的值
            const changeData = prod.reduce((acc: any[], cur) => {
                let result = acc
                // 分类型处理values值
                if (typeof cur.values === 'string') {
                    result = [...result, cur]
                } else {
                    cur.values.forEach((op) => {
                        result = [...result, { name: cur.name, values: op }]
                    })
                }
                return result
            }, [])
            // 组合内值相加
            return plusBinArr(
                ...changeData.map(
                    (cur) => veriationTypeMap[`${cur.name}-${cur.values}`],
                ),
            )
        })
    }, [products])

    /**
     * 判断(任务下)各模块操作的有无
     * @param path 检查路径 如:流程图下的编辑操作 'edit'
     * @param ignoreExecutableStatus 任务执行状态 默认false-不忽略 true-忽略
     * @return boolean true-有 false-无
     */
    const checkTask = useCallback(
        (path: string, ignoreExecutableStatus: boolean = false): boolean => {
            let pathArr = [path]
            // 任务下增加任务类型
            const isTask = taskInfo && JSON.stringify(taskInfo) !== '{}'
            if (isTask) {
                pathArr = [...pathArr, taskInfo.taskType]
            } else {
                pathArr = [...pathArr, 'none']
            }
            // 筛选组合值
            const checkValue = plusBinArr(
                ...pathArr.map((p) => {
                    if (operates.includes(p)) {
                        return veriationTypeMap[`operate-${p}`]
                    }
                    if ((Object.values(TaskType) as string[]).includes(p)) {
                        return veriationTypeMap[`task-${p}`]
                    }
                    if (p === 'none') {
                        return veriationTypeMap[`task-${p}`]
                    }
                    return undefined
                }),
            )
            // 判断当前组合是否存在
            const result = variationBinaryValues.some((value) =>
                equalBinArr(andBinArr(value, checkValue), checkValue),
            )
            // 任务下判断执行情况
            if (isTask && !ignoreExecutableStatus) {
                return (
                    result &&
                    taskInfo.taskExecutableStatus ===
                        TaskExecutableStatus.EXECUTABLE
                )
            }
            return result
        },
        [taskInfo],
    )

    /**
     * 判断(任务下)业务治理模块操作的有无
     * @param paths 检查操作 如:流程图下的新建、编辑操作 ['create','edit']
     * @param mode 方式 true-与 false-或
     * @return boolean true-有 false-无
     */
    const checkTasks = useCallback(
        (
            paths: string[],
            mode: boolean = true,
            ignoreExecutableStatus: boolean = false,
        ): boolean => {
            if (paths.length === 0) {
                return true
            }
            let result = true
            if (mode) {
                for (let i = 0; i < paths.length; i += 1) {
                    result =
                        result && checkTask(paths[i], ignoreExecutableStatus)
                    if (!result) {
                        break
                    }
                }
            } else {
                result = false
                for (let i = 0; i < paths.length; i += 1) {
                    result =
                        result || checkTask(paths[i], ignoreExecutableStatus)
                }
            }
            return result
        },
        [taskInfo],
    )

    return { checkTask, checkTasks }
}
