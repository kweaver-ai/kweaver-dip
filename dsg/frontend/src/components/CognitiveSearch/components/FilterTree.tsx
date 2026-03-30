import { DownOutlined } from '@ant-design/icons'
import { Button, Space, Tree } from 'antd'
import { memo, useEffect, useState } from 'react'
import { useUpdateEffect } from 'ahooks'
import { isEqual } from 'lodash'
import styles from './styles.module.less'
import __ from '../locale'
import { KEYTYPE, IFilterItem, InitData } from '../const'
import { ISearchDim, ISearchObj } from '@/core'
import { ParamsType, useCongSearchContext } from '../CogSearchProvider'
import { Loader } from '@/ui'

// 智能搜索对象
const ObjRender = (node: any) => {
    const { name, count, synonyms_flag }: ISearchObj = node
    return (
        <div className={styles['title-item']}>
            {synonyms_flag && (
                <span className={styles['title-item-same']}>{__('同')}</span>
            )}
            <div className={styles['title-item-title']} title={name}>
                {name}
            </div>
            <span
                hidden={count === undefined}
                className={styles['title-item-count']}
            >
                ({count})
            </span>
        </div>
    )
}

// 智能搜索维度
const DimRender = (node: any) => {
    const { name, class_name, count }: ISearchDim = node
    return (
        <div className={styles['title-item']}>
            <div className={styles['title-item-title']} title={name}>
                {name}
            </div>
            <span
                hidden={count === undefined}
                className={styles['title-item-count']}
            >
                ({count})
            </span>
        </div>
    )
}

const ObjNodeName = __('智能搜索对象')
const DimNodeName = __('智能搜索维度')

/**
 * 过滤条件
 * @returns
 */
function FilterTree() {
    const {
        loading,
        stopInfo,
        stopKeys,
        updateParams,
        commomWord,
        setCommonWord,
    } = useCongSearchContext()
    // 停用词
    const [stopWord, setStopWord] =
        useState<Record<KEYTYPE, string[]>>(InitData)
    const [treeData, setTreeData] =
        useState<Record<string, IFilterItem[]>>(InitData)
    const [checked, setChecked] = useState<Record<KEYTYPE, string[]>>(InitData)
    const [expandKeys, setExpandKeys] =
        useState<Record<KEYTYPE, string[]>>(InitData)
    const [allKeys, setAllKeys] = useState<Record<KEYTYPE, string[]>>(InitData)

    const [otherKeys, setOtherKeys] = useState<string[]>([])
    useUpdateEffect(() => {
        if (!isEqual(commomWord, stopWord?.[KEYTYPE.OBJ])) {
            setStopWord((prev) => ({ ...prev, [KEYTYPE.OBJ]: commomWord }))
            setChecked((prev) => {
                const curChecked = allKeys?.[KEYTYPE.OBJ].filter(
                    (o) => ![...(commomWord ?? []), ObjNodeName]?.includes(o),
                )
                return {
                    ...prev,
                    [KEYTYPE.OBJ]: curChecked,
                }
            })
        }
    }, [commomWord])

    useEffect(() => {
        const others = commomWord?.filter(
            (o) => !(allKeys?.[KEYTYPE.OBJ] || []).includes(o),
        )
        setOtherKeys(others)
    }, [commomWord, allKeys])

    useEffect(() => {
        // 处理对象
        const ObjList = [...(stopInfo?.[KEYTYPE.OBJ] || [])]
        const obj = [
            {
                name: ObjNodeName,
                children: ObjList,
            },
        ]
        const objKeys = ObjList?.reduce(
            (prev, cur) => {
                prev.push(cur.name)
                return prev
            },
            [ObjNodeName],
        )

        // 处理维度
        const DimList = [...(stopInfo?.[KEYTYPE.DIM] || [])]

        const dim = [
            {
                name: DimNodeName,
                children: DimList,
            },
        ]
        const dimKeys = DimList?.reduce(
            (prev, cur) => {
                prev.push(cur.name)
                if (cur.children) {
                    const childKeys = cur.children?.map((o) => o.name)
                    return prev.concat(childKeys)
                }
                return prev
            },
            [DimNodeName],
        )

        const keys = {
            [KEYTYPE.OBJ]: objKeys,
            [KEYTYPE.DIM]: dimKeys,
        }
        // 装载数据
        setChecked(keys)
        setExpandKeys(keys)
        setAllKeys(keys)
        setTreeData({
            [KEYTYPE.OBJ]: obj,
            [KEYTYPE.DIM]: dim,
        })
    }, [stopInfo])

    useEffect(() => {
        const stopObjKeys = stopKeys?.[KEYTYPE.OBJ] || []
        const stopDimKeys = (stopKeys?.[KEYTYPE.DIM] || [])?.reduce(
            (prev, cur) => {
                if (cur.names) {
                    return prev.concat(cur.names || [])
                }
                return prev
            },
            [],
        )
        setChecked((prev) => ({
            ...prev,
            [KEYTYPE.OBJ]: prev[KEYTYPE.OBJ]?.filter(
                (o) => !stopObjKeys.includes(o),
            ),
            [KEYTYPE.DIM]: prev[KEYTYPE.DIM]?.filter(
                (o) => !stopDimKeys.includes(o),
            ),
        }))
    }, [stopKeys])

    const handleChecked = (type: KEYTYPE, checkedKeys: any, info) => {
        const { halfCheckedKeys = [] } = info

        setChecked((prev) => ({ ...prev, [type]: checkedKeys }))
        const originName = type === KEYTYPE.OBJ ? ObjNodeName : DimNodeName
        // 停用词
        let unCheckedKeys: any = allKeys?.[type]?.filter(
            (o) =>
                ![...checkedKeys, ...halfCheckedKeys]?.includes(o) &&
                o !== originName,
        )

        // 单独处理维度 class_name
        if (type === KEYTYPE.DIM) {
            const childs = treeData[KEYTYPE.DIM]?.[0]?.children || []
            const unCheckArr = childs?.map((o: any) => {
                const { children, ...it } = o

                const currentNames = [it, ...(children || [])]?.map(
                    (item) => item.name,
                )
                const names = currentNames.filter((n) =>
                    unCheckedKeys.includes(n),
                )
                return {
                    class_name: o.class_name,
                    names,
                }
            })
            unCheckedKeys = unCheckArr?.filter((o) => o?.names?.length > 0)
        }

        setStopWord((prev) => ({ ...prev, [type]: unCheckedKeys }))
    }

    const handleExpand = (type: KEYTYPE, isExpand: boolean, keys: any[]) => {
        const curExpands = expandKeys?.[type] || []
        let keyList: string[] = []
        if (isExpand) {
            keyList = [...keys, ...curExpands]
        } else {
            keyList = curExpands.filter((k) => !keys.includes(k))
        }
        setExpandKeys((prev) => ({ ...prev, [type]: keyList }))
    }

    const handleReset = () => {
        setChecked(allKeys)
        setStopWord(InitData)
        updateParams(ParamsType.StopKey, { ...InitData })
        setCommonWord(otherKeys)
    }
    return (
        <div className={styles['filter-wrapper']}>
            <div
                className={styles['filter-wrapper-title']}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <span>{__('过滤条件')}</span>
                <span hidden={loading}>
                    <Space direction="horizontal" size={8}>
                        <Button
                            type="default"
                            size="middle"
                            onClick={handleReset}
                        >
                            重置
                        </Button>
                        <Button
                            type="default"
                            size="middle"
                            onClick={() => {
                                setCommonWord([
                                    ...otherKeys,
                                    ...(stopWord?.[KEYTYPE.OBJ] || []),
                                ])
                                updateParams(ParamsType.StopKey, {
                                    ...stopWord,
                                })
                            }}
                        >
                            查询
                        </Button>
                    </Space>
                </span>
            </div>
            <div className={styles['filter-wrapper-list']}>
                {loading ? (
                    <Loader />
                ) : (
                    Object.values(KEYTYPE).map((type) => (
                        <div
                            className={styles['filter-wrapper-list-item']}
                            key={type}
                        >
                            <Tree
                                className={styles['select-tree']}
                                checkable
                                selectable={false}
                                switcherIcon={
                                    <DownOutlined
                                        className={
                                            styles['select-tree-switcher']
                                        }
                                    />
                                }
                                defaultExpandAll
                                onCheck={(checkedKeys, info) =>
                                    handleChecked(type, checkedKeys, info)
                                }
                                fieldNames={{ title: 'name', key: 'name' }}
                                titleRender={
                                    type === KEYTYPE.OBJ ? ObjRender : DimRender
                                }
                                checkedKeys={checked?.[type]}
                                expandedKeys={expandKeys?.[type]}
                                onExpand={(expandedKeys, { expanded, node }) =>
                                    handleExpand(type, expanded, [node.key])
                                }
                                treeData={treeData?.[type] as any}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default memo(FilterTree)
