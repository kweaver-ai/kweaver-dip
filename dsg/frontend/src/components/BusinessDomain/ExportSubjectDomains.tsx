import { Button, Checkbox, message, Modal, Tooltip } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { cloneDeep, pullAll, uniq } from 'lodash'
import { CaretRightOutlined } from '@ant-design/icons'
import {
    exportSubjectDomains,
    formatError,
    getSubjectDomain,
    ISubjectDomainItem,
} from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import { CloseOutlined } from '@/icons'
import { BusinessDomainType } from '../BusinessDomain/const'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'
import { GlossaryIcon } from './GlossaryIcons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { cancelRequest, streamToFile } from '@/utils'

interface DataNode {
    children: DataNode[]
    isExpand: boolean
    [key: string]: any
}

interface IExportSubjectDomains {
    open: boolean
    onClose: () => void
}

const ExportSubjectDomains: React.FC<IExportSubjectDomains> = ({
    open,
    onClose,
}) => {
    const [loading, setLoading] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    // 转化后的树结构数据
    const [treeData, setTreeData] = useState<DataNode[]>([])
    // 选中的节点
    const [selectedNodes, setSelectedNodes] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            getTreeData()
        } else {
            setTreeData([])
            setSelectedNodes([])
            setSearchValue('')
        }
    }, [open])

    // 导出
    const handleOk = async () => {
        try {
            setExporting(true)
            const res = await exportSubjectDomains(
                selectItems.map((obj) => obj.id),
            )
            let fileName = `${__(
                '业务对象excel导出',
            )}-${new Date().getTime()}.xlsx`
            if (selectItems.length === 1) {
                fileName = `${
                    flattenedItems.find((item) => item.id === selectItems[0].id)
                        ?.name
                }.xlsx`
            }
            streamToFile(res, fileName)
            message.success(__('导出成功'))
            onClose()
        } catch (error) {
            const enc = new TextDecoder('utf-8')
            const errData = JSON.parse(enc.decode(new Uint8Array(error.data)))
            error.data = errData
            formatError(error)
        } finally {
            setExporting(false)
        }
    }

    // 获取树数据
    const getTreeData = async () => {
        try {
            setLoading(true)
            const res = await getSubjectDomain({
                limit: 0,
                is_all: true,
                parent_id: '',
                type: `${BusinessDomainType.subject_domain_group},${BusinessDomainType.subject_domain},${BusinessDomainType.business_activity},${BusinessDomainType.business_object}`,
                need_count: true,
            })
            setTreeData(buildTree(res?.entries || []))
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const buildTree = (value: Array<ISubjectDomainItem>) => {
        const currentData = value
            ?.map((item) => ({
                ...item,
                path_id: item?.path_id?.split('/') || [item.id],
            }))
            .reduce((preData, item) => {
                if (preData?.[item.path_id.length]) {
                    return {
                        ...preData,
                        [item.path_id.length]: [
                            ...preData[item.path_id.length],
                            item,
                        ],
                    }
                }
                return {
                    ...preData,
                    [item.path_id.length]: [item],
                }
            }, {})
        return buildTreeLevel(currentData, 1, '')
    }

    const buildTreeLevel = (items, level: number, fatherId) => {
        if (fatherId) {
            const currentItems = items[level].filter((item) => {
                return item?.path_id?.includes(fatherId)
            })
            if (currentItems.length) {
                return currentItems.map((item) => ({
                    ...item,
                    key: item.id,
                    title: item.name,
                    children: items[level + 1]?.length
                        ? buildTreeLevel(items, Number(level) + 1, item.id)
                        : [],
                }))
            }
            return []
        }
        return (
            items[level]?.map((item) => ({
                ...item,
                key: item.id,
                title: item.name,
                children: items[level + 1]?.length
                    ? buildTreeLevel(items, Number(level) + 1, item.id)
                    : [],
            })) || []
        )
    }

    const flatten = (items: DataNode[]): DataNode[] => {
        return items.reduce<DataNode[]>((acc, item) => {
            return [...acc, item, ...flatten(item.children)]
        }, [])
    }

    // 扁平化树结构
    const flattenedItems = useMemo(() => flatten(treeData), [treeData])

    // 搜索结果
    const searchItems = useMemo(
        () =>
            flattenedItems.filter(
                (item) =>
                    [
                        BusinessDomainType.business_activity,
                        BusinessDomainType.business_object,
                    ].includes(item.type as BusinessDomainType) &&
                    (item.name.includes(searchValue) ||
                        item.name.match(
                            new RegExp(
                                searchValue.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    '\\$&',
                                ),
                                'gi',
                            ),
                        )),
            ),
        [flattenedItems, searchValue],
    )

    // 是否全部选中
    const selectAll = useMemo(
        () => flattenedItems.length === selectedNodes.length,
        [selectedNodes, flattenedItems],
    )

    // 选中的对象/活动
    const selectItems = useMemo(
        () =>
            flattenedItems.filter(
                (item) =>
                    [
                        BusinessDomainType.business_activity,
                        BusinessDomainType.business_object,
                    ].includes(item.type) && selectedNodes.includes(item.id),
            ),
        [selectedNodes, flattenedItems],
    )

    // 选中节点
    const onSelectedNode = (checked: boolean, td?: DataNode) => {
        // 点击全部
        if (!td) {
            if (checked) {
                setSelectedNodes(flattenedItems.map((item) => item.id))
            } else {
                setSelectedNodes([])
            }
            return
        }

        // 点击其他类型
        if (checked) {
            setSelectedNodes((prev) =>
                uniq([
                    ...prev,
                    ...td.path_id,
                    ...flatten(td.children).map((item) => item.id),
                ]),
            )
        } else {
            setSelectedNodes((prev) =>
                uniq(
                    prev
                        .filter(
                            (item) =>
                                !td.path_id.includes(item) &&
                                !flatten(td.children).find(
                                    (cd) => cd.id === item,
                                ),
                        )
                        .reduce<string[]>(
                            (acc, cur) => [
                                ...acc,
                                ...(flattenedItems.find(
                                    (item) => item.id === cur,
                                )?.path_id || []),
                            ],
                            [],
                        ),
                ),
            )
        }
    }

    const getItems = (objs: DataNode[], isSearch = false) => {
        return objs.map((so) => {
            const checked = selectedNodes.includes(so.id)
            return (
                <div
                    className={classnames({
                        [styles.seletedItem]: true,
                        [styles.seletedSearchItem]: isSearch && checked,
                    })}
                    key={so.id}
                    onClick={() => {
                        if (isSearch) {
                            onSelectedNode(!checked, so)
                        }
                    }}
                >
                    <div className={styles.leftInfo}>
                        {isSearch && (
                            <Checkbox
                                className={styles.check}
                                checked={checked}
                            />
                        )}
                        <GlossaryIcon
                            type={so.type}
                            fontSize="28px"
                            width="28px"
                            styles={{ flexShrink: 0 }}
                        />
                        <div className={styles.infos}>
                            <div title={so.name} className={styles.name}>
                                {so.name}
                            </div>
                            <div title={so.path_name} className={styles.path}>
                                {__('路径：')} {so.path_name}
                            </div>
                        </div>
                    </div>
                    {!isSearch && (
                        <CloseOutlined
                            className={styles.closeIcon}
                            onClick={() => onSelectedNode(false, so)}
                        />
                    )}
                </div>
            )
        })
    }

    const getTreeNode = (tree: DataNode[], func): DataNode | null => {
        // eslint-disable-next-line
        for (const node of tree) {
            if (func(node)) return node
            if (node.children) {
                const res = getTreeNode(node.children, func)
                if (res) return res
            }
        }
        return null
    }

    const renderTreeNode = (td: DataNode) => {
        const checked = selectedNodes.includes(td.id)
        const indeterminate =
            checked &&
            pullAll(
                flatten(td.children).map((item) => item.id),
                selectedNodes,
            ).length > 0
        const isLeaf = td.children.length === 0
        return (
            <div
                className={classnames(
                    styles.node,
                    selectedNodes.includes(td.id) && styles.selected,
                )}
                style={{
                    paddingLeft: 24 * (td.path_id.length - 1) + 8,
                }}
                onClick={() => {
                    onSelectedNode(!checked, td)
                }}
            >
                <Checkbox checked={checked} indeterminate={indeterminate} />
                {!isLeaf && (
                    <CaretRightOutlined
                        className={classnames(
                            styles['node-arrow'],
                            td.isExpand && styles.expand,
                        )}
                        onClick={(e) => {
                            e.stopPropagation()
                            const temp = cloneDeep(treeData)
                            const curNode = getTreeNode(
                                temp || [],
                                (node: DataNode) => node.id === td.id,
                            )
                            if (!curNode) return
                            curNode.isExpand = !curNode.isExpand
                            setTreeData(temp)
                        }}
                    />
                )}
                <GlossaryIcon
                    type={td.type}
                    fontSize="20px"
                    width="20px"
                    styles={{
                        flexShrink: 0,
                        marginRight: 6,
                        marginLeft: isLeaf ? 8 : 0,
                    }}
                />
                <div className={styles['node-content']}>
                    <div
                        className={classnames(styles['node-content-name'])}
                        title={td.name}
                    >
                        {td.name || '--'}
                    </div>
                </div>
            </div>
        )
    }

    const renderTreeNodes = (data: DataNode[]) => {
        return data.map((item, index) => {
            return (
                <div key={item.id}>
                    {renderTreeNode(item)}
                    <div hidden={!item.isExpand}>
                        {item.children ? renderTreeNodes(item.children) : null}
                    </div>
                </div>
            )
        })
    }

    const handleCancel = () => {
        cancelRequest('/api/data-subject/v1/subject-domains/export', 'post')
        onClose()
    }

    const footer = (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
                style={{ minWidth: 80, marginRight: 12 }}
                onClick={() => handleCancel()}
            >
                {__('取消')}
            </Button>
            <Tooltip
                placement="topRight"
                title={
                    selectItems.length > 0
                        ? selectItems.length > 50
                            ? __('最大导出数量为50个')
                            : ''
                        : __('请选择要导出的数据')
                }
            >
                <Button
                    style={{ minWidth: 80 }}
                    type="primary"
                    disabled={
                        selectItems.length === 0 || selectItems.length > 50
                    }
                    onClick={handleOk}
                    loading={exporting}
                >
                    {__('导出')}
                </Button>
            </Tooltip>
        </div>
    )

    return (
        <Modal
            title={__('导出')}
            width={800}
            open={open}
            bodyStyle={{ height: 484, padding: '20px 24px' }}
            destroyOnClose
            onCancel={() => handleCancel()}
            maskClosable={false}
            onOk={handleOk}
            footer={footer}
        >
            <div className={styles.exportSubjectDomains}>
                <div className={styles.title}> {__('请选择业务对象/活动')}</div>
                <div className={styles.content}>
                    <div className={styles.left}>
                        <div className={styles.searchInput}>
                            <SearchInput
                                placeholder={__('搜索业务对象/活动')}
                                value={searchValue}
                                onKeyChange={(kw: string) => {
                                    if (kw === searchValue) return
                                    setSearchValue(kw)
                                }}
                            />
                        </div>
                        {loading ? (
                            <div className={styles.loader}>
                                <Loader />
                            </div>
                        ) : (
                            <div className={styles.treeWrap}>
                                {flattenedItems.length === 0 ? (
                                    <Empty
                                        iconSrc={dataEmpty}
                                        desc={__('暂无数据')}
                                    />
                                ) : searchValue ? (
                                    searchItems.length === 0 ? (
                                        <Empty />
                                    ) : (
                                        <div className={styles.searchList}>
                                            {getItems(searchItems, true)}
                                        </div>
                                    )
                                ) : (
                                    <>
                                        <div
                                            className={classnames(
                                                styles.top,
                                                selectAll && styles.checked,
                                            )}
                                            onClick={() => {
                                                onSelectedNode(!selectAll)
                                            }}
                                        >
                                            <Checkbox
                                                checked={selectAll}
                                                indeterminate={
                                                    !selectAll &&
                                                    selectedNodes.length > 0
                                                }
                                            />
                                            <span className={styles.all}>
                                                {__('全选')}
                                            </span>
                                        </div>
                                        <div className={styles.tree}>
                                            {renderTreeNodes(treeData)}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <div className={styles.right}>
                        <div className={styles.top}>
                            <span className={styles.count}>
                                {__('已选择：${num} 个', {
                                    num: selectItems.length || `0`,
                                })}
                            </span>
                            <span
                                className={classnames(
                                    styles.clear,
                                    selectItems.length === 0 &&
                                        styles.clearDisabled,
                                )}
                                onClick={() => {
                                    if (selectItems.length === 0) return
                                    setSelectedNodes([])
                                }}
                            >
                                {__('全部移除')}
                            </span>
                        </div>
                        <div className={styles.bottom}>
                            {selectItems.length > 0 && getItems(selectItems)}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
export default ExportSubjectDomains
