import React, {
    useEffect,
    useState,
    useRef,
    forwardRef,
    useImperativeHandle,
    ReactNode,
} from 'react'
import { Dropdown, Tree, Tabs, Tooltip, message } from 'antd'
import classnames from 'classnames'
import { useUpdateEffect } from 'ahooks'
import { isEqual } from 'lodash'
import { DownOutlined, CloseCircleFilled } from '@ant-design/icons'
import { CloseOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { SearchInput, Empty } from '@/ui'
import Icons from '@/components/DatasheetView/Icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    getTagCategoryExcludeTreeNode,
    formatError,
    getTagCategoryDetailsByType,
    getTagRecommend,
    getTagByIds,
} from '@/core'

interface IBusinessTagsSelect {
    onChange: (val) => void
    value?: string[]
    placeholder?: string
    limit?: number
    limitErrorTips?: string
    recommendParams?: any
}

/**
 * @param onChange 值变化时，调用函数
 * @param value 已选值
 * @param placeholder 选择框默认文本
 * @param searchPlaceholder 搜索默认文本
 * @param undistributedKey 固定底部选项key，例如未分配
 */
const BusinessTagsSelect = forwardRef((props: IBusinessTagsSelect, ref) => {
    const {
        placeholder = __('请选择标签'),
        onChange,
        value,
        limit = 5,
        limitErrorTips = __('最多可添加${sum}个标签', { sum: limit }),
        recommendParams,
    } = props

    const selectTagsDom: any = useRef()
    const selectSubTagsDom: any = useRef()
    const [initData, setInitData] = useState<any[]>([])
    const [selectedData, setSelectedData] = useState<any[]>([])
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    const [isInit, setIsInit] = useState<boolean>(true)
    const [searchCondition, setSearchCondition] = useState<any>({
        offset: 1,
        limit: 100,
        keyword: '',
        range_type: '1',
    })
    const [tagClassifyDataList, setTagClassifyDataList] = useState<any>([])
    const [currentClassify, setCurrentClassify] = useState<string>('recommend')
    const [tagTreeData, setTagTreeData] = useState<any>([])
    const recommendClassify = { key: 'recommend', label: __('推荐') }
    const [recommendTagList, setRecommendTagList] = useState<any[]>([])

    const handleOpenDropdownChange = (flag: boolean) => {
        setOpenDropdown(flag)
        if (flag && recommendParams && recommendParams?.[0]?.name) {
            getRecommendList()
        }
    }

    useImperativeHandle(ref, () => ({
        getRecommendList,
    }))

    useEffect(() => {
        getDataList()
    }, [])

    useEffect(() => {
        if (value?.length && isInit) {
            getSelectedDataByValue()
        }
    }, [value])

    useUpdateEffect(() => {
        if (
            onChange &&
            !isEqual(
                value || [],
                selectedData.map((item) => item.id),
            )
        ) {
            onChange(selectedData?.map((item) => item.id))
        }
        if (selectedData.length === 0 && !isInit) {
            onChange([])
        }
    }, [selectedData])

    // 获取标签分类列表
    const getDataList = async () => {
        try {
            const { entries } = await getTagCategoryExcludeTreeNode(
                searchCondition,
            )
            setTagClassifyDataList([
                recommendClassify,
                ...(entries?.map((item) => ({
                    key: item.id,
                    label: item.name,
                })) || []),
            ])
        } catch (err) {
            formatError(err)
        }
    }

    const getRecommendList = async () => {
        try {
            const res = await getTagRecommend({ query_items: recommendParams })
            setRecommendTagList(res?.items?.[0]?.rec || [])
            if (isInit && !value?.length) {
                const [firstNode] = res?.items || []
                const [firstTag] = firstNode?.rec || []
                if (firstTag && !selectedData?.length) {
                    setSelectedData((pre) => [firstTag, ...pre])
                }
            }
        } catch (err) {
            // formatError(err)
        }
    }

    const getTagTreeById = async (id: string) => {
        try {
            const res = await getTagCategoryDetailsByType({ id, type: 1 })
            setTagTreeData(res?.label_tree_resp)
        } catch (err) {
            formatError(err)
        }
    }

    const onClassifyChange = (key: string) => {
        setCurrentClassify(key)
        if (key !== 'recommend') {
            getTagTreeById(key)
        }
    }

    const getSelectedDataByValue = async () => {
        try {
            const res = await getTagByIds(value || [])
            setSelectedData(res?.label_resp || [])
        } catch (err) {
            formatError(err)
        }
    }

    const reset = () => {
        setSelectedData([])
        onChange([])
    }

    const delSelectedData = (data: any) => {
        const arry = selectedData.filter((item) => {
            return item.id !== data.id
        })
        setSelectedData(arry)
    }

    const empty = () => {
        return (
            <div className={styles.emptyBox}>
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            </div>
        )
    }

    const nodeClick = (isSelected: boolean, node: any) => {
        setIsInit(false)
        if (isSelected) {
            delSelectedData(node)
        } else {
            if (selectedData.length > limit - 1) {
                message.info(limitErrorTips)
                return
            }
            setSelectedData((pre) => [...pre, node])
        }
    }

    const treeNode = (node: any) => {
        const isSelected = selectedData?.map((it) => it.id)?.includes(node.id)
        return (
            <div
                className={classnames(
                    styles.treeNode,
                    isSelected && styles.selected,
                )}
                onClick={() => nodeClick(isSelected, node)}
            >
                {node.name}
            </div>
        )
    }

    const updateTreeData = (list: any[]): any[] =>
        list.map((node) => {
            if (node.children) {
                return {
                    ...node,
                    key: node.id,
                    title: treeNode(node),
                    children: updateTreeData(node.children),
                }
            }
            return {
                ...node,
                key: node.id,
                title: treeNode(node),
            }
        })

    const recommendNode = () => {
        return !recommendTagList?.length ? (
            empty()
        ) : (
            <div className={styles.recommendWrapper}>
                {recommendTagList.map((item) => {
                    const isSelected = selectedData
                        ?.map((it) => it.id)
                        ?.includes(item.id)

                    return (
                        <div
                            key={item.id}
                            className={classnames(
                                styles.treeNode,
                                styles.recommend,
                                isSelected && styles.selected,
                            )}
                            onClick={() => nodeClick(isSelected, item)}
                        >
                            <div
                                className={styles.treeNodeName}
                                title={item?.name}
                            >
                                {item?.name}
                            </div>
                            <div
                                className={styles.treeNodePath}
                                title={item?.category_name || item?.path}
                            >
                                {item?.category_name || item?.path}
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const dropdownItems = [
        {
            key: '1',
            label: (
                <div className={styles.dropdownOverlay}>
                    <div className={styles.itemBox}>
                        <Tabs
                            activeKey={currentClassify}
                            onChange={onClassifyChange}
                            items={tagClassifyDataList}
                        />
                        <div className={styles.itemTreeBox}>
                            {currentClassify === 'recommend' ? (
                                recommendNode()
                            ) : !tagTreeData?.length ? (
                                empty()
                            ) : (
                                <Tree
                                    blockNode
                                    showIcon
                                    switcherIcon={<DownOutlined />}
                                    treeData={updateTreeData(tagTreeData || [])}
                                    className={styles.treeWrapper}
                                />
                            )}
                        </div>
                    </div>
                </div>
            ),
        },
    ]

    return (
        <div className={styles.businessTagsSelectWrapper}>
            <Dropdown
                menu={{ items: dropdownItems }}
                trigger={['click']}
                onOpenChange={handleOpenDropdownChange}
                open={openDropdown}
                placement="bottomLeft"
                overlayClassName={styles.filterDropdown}
                getPopupContainer={(node) => node.parentElement || node}
            >
                <div className={styles.selectedText} ref={selectTagsDom}>
                    {selectedData.length > 0 ? (
                        <div
                            className={styles.selectedTagBox}
                            ref={selectSubTagsDom}
                        >
                            {selectedData.map((item) => {
                                return (
                                    <span
                                        key={item.id}
                                        className={styles.selectedTag}
                                    >
                                        <Tooltip
                                            color="#fff"
                                            overlayInnerStyle={{
                                                color: 'rgba(0,0,0,0.85)',
                                            }}
                                            title={item?.path}
                                        >
                                            <span
                                                className={
                                                    styles.selectedTagName
                                                }
                                                title={item?.name}
                                            >
                                                {item?.name}
                                            </span>
                                        </Tooltip>
                                        <CloseOutlined
                                            className={styles.selectedTagIcon}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                                setInitData(
                                                    initData.map((it) => {
                                                        const obj: any = it
                                                        if (it.id === item.id) {
                                                            obj.checked = false
                                                        }
                                                        return obj
                                                    }),
                                                )
                                                delSelectedData(item)
                                            }}
                                        />
                                    </span>
                                )
                            })}
                        </div>
                    ) : (
                        <span className={styles.filterText}>{placeholder}</span>
                    )}
                    <span
                        className={classnames(
                            styles.dropIcon,
                            selectedData.length > 0 && styles.hasData,
                        )}
                    >
                        <DownOutlined className={styles.down} />
                        <CloseCircleFilled
                            className={styles.close}
                            onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                reset()
                            }}
                        />
                    </span>
                </div>
            </Dropdown>
        </div>
    )
})

export default BusinessTagsSelect
