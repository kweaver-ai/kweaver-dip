import React, { Key, useEffect, useState } from 'react'

import { Modal, Tree, message, TreeProps, Tooltip } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { isEqual, noop, trim } from 'lodash'
import {
    CatalogType,
    getDirDataBySearch,
    getDirDataByTypeOrId,
    IDirItem,
    IDirQueryType,
    moveCodeRuleByIds,
    moveDataEleByIds,
    moveDictByIds,
    moveFileByIds,
    formatError,
    updateDirById,
} from '@/core'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import styles from './styles.module.less'

import { OperateType } from '@/utils'
import { highLight } from './const'
import { PullDownOutlined } from '@/icons'
import { SearchInput } from '@/ui'

const { TreeNode } = Tree

/**
 * @param visible 对话框可见与否
 * @param dirType 目录类型
 * @param onClose 关闭对话框事件
 * @param oprType OperateType.MOVETO：移动目录至（用于：目录移动至）；
 *                OperateType.MOVEDATATO：移动数据元/码表至（用于：数据元/码表的目录移动至）；
 *                OperateType.SELECT：选择目录（用于：导入/编辑/新建数据元），
 * @param oprItem 点击确认，对话框处理的对象（如：选中的目录或选中的数据元）
 * @param setOprItem 设置选中操作对象的方法
 * @param afterOprReload 选中目录后的操作（newSelctedDir:对话框中选中目录）
 */
interface IEditDir {
    title: string
    visible: boolean
    dirType: CatalogType
    onClose: () => void
    oprType: string
    oprItem: any
    setOprItem: (newOprItem: any) => void
    afterOprReload: (newSelectedDir?: any) => void
}

/**
 * 编辑目录（用于包括目录移动至，移动数据元所属目录，导入数据元/码表目录的修改）
 * @param dirType 目录类型
 * @returns
 */
const EditDirModal: React.FC<IEditDir> = (props) => {
    const {
        visible,
        dirType,
        onClose,
        title,
        oprType,
        oprItem,
        setOprItem = noop,
        afterOprReload,
    } = props

    const [loading, setLoading] = useState(false)

    const [treeData, setTreeData] = useState<Array<IDirItem>>([])

    const [noMatch, setNoMatch] = useState<boolean>(false)

    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')

    // 被选中节点
    const [checkedKey, setCheckedKey] = useState<Array<Key>>([])

    // 传入的目录节点
    const [defaultselDir, setDefaultSeDir] = useState<IDirItem>()

    const [errorText, setErrorText] = useState('')

    // 点击确认，按钮loading状态（防止重复提交）
    const [okLoading, setOKLoading] = useState(false)

    // 目录搜索条件
    const [searchCondition, setSearchCondition] = useState<any>()

    useEffect(() => {
        if (visible) {
            getTreeList(searchCondition)
        }
    }, [visible, searchCondition])

    const getTreeList = async (query?: IDirQueryType) => {
        try {
            setLoading(true)
            let res
            if (query?.catalog_name) {
                res = await getDirDataBySearch(query)
            } else {
                // 数据元祖先目录节点id：11
                res = await getDirDataByTypeOrId(dirType, undefined)
            }
            const data = res.data ? res.data : []
            if (
                oprType === OperateType.MOVETO ||
                oprType === OperateType.MOVEDATATO
            ) {
                rotateTreeData(data, oprItem, {
                    disabled: true,
                    disableCheckbox: true,
                })
            } else if (oprType === OperateType.SELECT) {
                if (query && !query.catalog_name) {
                    if (checkedKey && checkedKey.length === 0) {
                        setCheckedKey([oprItem?.id || ''])
                    }
                }
            }
            setTreeData(data)
        } catch (error: any) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const rotateTreeData = (data: any[], searchOprItem: any, params: {}) => {
        data.forEach((item) => {
            if (searchOprItem?.id === item.id) {
                // 禁用当前目录节点本身
                Object.assign(item, params)
                if (item.children) {
                    const { children } = item
                    children.forEach((item2: any) => {
                        rotateTreeData(children, item2, params)
                    })
                }
            } else {
                // 禁用父节点（当前目录的父目录）
                if (searchOprItem?.parent_id === item.id) {
                    Object.assign(item, params)
                }
                // 禁用子节点（当前目录的子目录）- 包括搜索情况下不在同一分支的子节点
                if (item.parent_id === searchOprItem?.id) {
                    Object.assign(item, params)
                }
                if (item.children) {
                    rotateTreeData(item.children, searchOprItem, params)
                }
            }
        })
        return data
    }

    useEffect(() => {
        if (visible) {
            if (searchCondition?.type === dirType) {
                setSearchCondition({
                    type: dirType,
                })
            }
        } else {
            // 关闭之后清空选中节点
            setCheckedKey([])
            setSearchKey('')
            setExpandedKeys([])
            setAutoExpandParent(false)
        }
    }, [oprItem, visible])

    // useEffect(() => {
    //     // setCheckedKey([])
    //     getTreeList({
    //         type: dirType,
    //         catalog_name: searchKey,
    //     })
    //     // 搜索框清空，默认展开选中项
    //     if (searchKey && searchKey === '') {
    //         const expandedKeysTemp = Object.assign([], expandedKeys)
    //         if (checkedKey && checkedKey[0]) {
    //             expandedKeysTemp.push(checkedKey[0])
    //             setExpandedKeys(expandedKeysTemp)
    //         }
    //     }
    // }, [searchKey])

    const renderTreeNodes = (data: any[]) =>
        data.map((item: any) => {
            const node = (
                <div
                    className={styles.treeNodeCon}
                    style={{ display: 'flex', alignItems: 'center' }}
                >
                    <Tooltip
                        title={
                            <div
                                // eslint-disable-next-line react/no-danger
                                dangerouslySetInnerHTML={{
                                    __html: highLight(
                                        item.catalog_name,
                                        searchKey,
                                        'toolTipHighLight',
                                    ),
                                }}
                            />
                        }
                    >
                        <span
                            className={styles.treeNodeConTitle}
                            // eslint-disable-next-line react/no-danger
                            dangerouslySetInnerHTML={{
                                __html: highLight(item.catalog_name, searchKey),
                            }}
                        />
                    </Tooltip>
                </div>
            )
            if (item.children) {
                return (
                    <TreeNode
                        title={node}
                        key={item.id}
                        disabled={item.disabled}
                        disableCheckbox={item.disableCheckbox}
                        className={styles.treeNode}
                    >
                        {renderTreeNodes(item.children)}
                    </TreeNode>
                )
            }
            return (
                <TreeNode
                    title={node}
                    key={item.id}
                    disabled={item.disabled}
                    disableCheckbox={item.disableCheckbox}
                    className={styles.treeNode}
                />
            )
        })

    const findNodeItemByKey = (data: any[], key: string) => {
        let nodeItem
        data.forEach((item: any) => {
            if (item.id === key) {
                nodeItem = item
            } else if (item.children) {
                findNodeItemByKey(item.children, key)
            }
        })
        return nodeItem
    }

    // 通过key获取目录
    const findDirByKey = (key: Key, data: any[]): IDirItem | undefined => {
        let dir
        data.forEach((item: any) => {
            if (item.id === key) {
                dir = item
            } else if (item.children) {
                const res = findDirByKey(key, item.children)
                if (res) {
                    dir = res
                }
            }
        })
        return dir
    }

    // 确定
    const handleMove = async () => {
        setOKLoading(true)
        // setOprItem(checkedKey)
        // 目录-目录移动至XX目录
        if (oprType === OperateType.MOVETO) {
            // if (checkedKey.length === 0 || checkedKey[0] === '') {
            //     message.error('请选择目录')
            //     return
            // }
            if (oprItem?.id) {
                try {
                    setLoading(true)
                    await updateDirById(oprItem.id, {
                        catalog_name: oprItem?.catalog_name,
                        parent_id: checkedKey[0].toString(),
                    })
                    setErrorText('')
                    onClose()
                    message.success('移动成功')
                    afterOprReload()
                } catch (error: any) {
                    // 400中特定key错误不重新获取目录，仍保持编辑/添加输入框状态
                    if (error.status === 400) {
                        const detailKey = error.data.detail
                            ? error.data.detail[0].Key
                            : ''
                        const detailDesc = error.data.detail
                            ? error.data.detail[0].Message
                            : ''

                        if (detailKey) {
                            // 目录名称重复，则不重新获取，聚焦到输入框
                            if (detailKey === 'OperationConflict') {
                                // 设置message最大显示条数为1
                                message.config({
                                    maxCount: 1,
                                })
                                message.error(detailDesc)
                                // 还原message设置
                                message.config({})
                                return
                            }
                            if (detailKey === 'Standardization.Empty') {
                                message.error(detailDesc)
                                return
                            }
                        }
                    }
                    formatError(error)
                } finally {
                    setLoading(false)
                    onClose()
                    setOKLoading(false)
                }
            }
        } else if (oprType === OperateType.SELECT) {
            // 选择目录，设置传入的oprItem，用于：数据元/码表导入，数据元/码表新建/编辑时选择目录
            const dir = findDirByKey(checkedKey[0], treeData)
            if (dir && dir.id) {
                setOprItem(dir)
            }
            onClose()
            setOKLoading(false)
        } else if (OperateType.MOVEDATATO === oprType) {
            // 移动数据元/码表至XX目录
            try {
                setLoading(true)
                const dir = findDirByKey(checkedKey[0], treeData)
                // 移动数据元
                if (dirType === CatalogType.DATAELE) {
                    const moveIds = oprItem?.length ? oprItem.join?.() : ''
                    if (moveIds !== '') {
                        await moveDataEleByIds(checkedKey[0], moveIds)
                    }
                } else if (dirType === CatalogType.CODINGRULES) {
                    const moveIds = oprItem?.length ? oprItem : []
                    await moveCodeRuleByIds(checkedKey[0], moveIds)
                } else if (dirType === CatalogType.CODETABLE) {
                    // 移动码表
                    const moveIds = oprItem?.length ? oprItem : []
                    await moveDictByIds(checkedKey[0], moveIds)
                } else if (dirType === CatalogType.FILE) {
                    // 移动文件
                    const moveIds = oprItem?.length ? oprItem : []
                    await moveFileByIds(checkedKey[0], moveIds)
                }
                message.success('移动成功')
                afterOprReload(dir)
            } catch (error: any) {
                formatError(error)
            } finally {
                setLoading(false)
                onClose()
                setOprItem([])
                setOKLoading(false)
            }
        }
    }

    const handleCancel = () => {
        onClose()
    }

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const value = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(value)
        const searchConditionTemp = {
            type: dirType,
            catalog_name: value,
        }
        if (!isEqual(searchCondition, searchConditionTemp)) {
            setSearchCondition(searchConditionTemp)
        }
        // 搜索框清空，默认展开选中项
        if (value && value === '') {
            const expandedKeysTemp = Object.assign([], expandedKeys)
            if (checkedKey && checkedKey[0]) {
                expandedKeysTemp.push(checkedKey[0])
                setExpandedKeys(expandedKeysTemp)
            }
        }
    }

    const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
        const checked = Array.isArray(checkedKeys)
            ? checkedKeys
            : checkedKeys.checked
        const myKey = checked.length > 0 ? checked[checked.length - 1] : ''
        if (myKey) {
            setCheckedKey([myKey])
        } else {
            // 表示用户取消选择
            setCheckedKey([''])
        }
    }

    const rootId = treeData && treeData[0]?.id ? treeData[0].id.toString() : ''

    const [expandedKeys, setExpandedKeys] = useState<Key[]>([])

    useEffect(() => {
        // const myExpandkeys = Object.assign([], expandedKeys)
        // if (rootId !== '' && myExpandkeys.indexOf(rootId) === -1) {
        //     myExpandkeys.push(rootId)
        // }
        // setExpandedKeys(myExpandkeys)

        // 展示搜索所有节点
        if (searchKey && searchKey !== '') {
            const allExpdKeys = traverseTree(treeData[0], 'id')
            setExpandedKeys(allExpdKeys)
        } else {
            // 默认展开根目录节点
            const expandedKeysTemp = [rootId]
            // 若有选择目录节点，则自动展开节点
            if (checkedKey && checkedKey.length > 0) {
                expandedKeysTemp.push(checkedKey[0].toString())
                setAutoExpandParent(true)
            }
            setExpandedKeys(expandedKeysTemp)
        }
    }, [treeData])

    // useEffect(() => {
    //     if (!visible) {
    //         // 关闭之后清空选中节点
    //         setCheckedKey([])
    //     }
    // }, [visible])

    const [autoExpandParent, setAutoExpandParent] = useState(false)
    const onExpand = (expandedKeysValue: Key[]) => {
        // if not set autoExpandParent to false, if children expanded, parent can not collapse.
        // or, you can remove all expanded children keys.
        setExpandedKeys(expandedKeysValue)
        // setAutoExpandParent(false)
    }

    // 深度优先遍历
    const traverseTree = (treeDataList: any, key: string) => {
        const child = treeDataList?.children ? treeDataList.children : []
        let arr: any[] = []
        if (treeDataList && treeDataList[key]) {
            arr.push(treeDataList[key])
        }
        if (child) {
            child.forEach((newTreeDataList: any) => {
                arr = Object.assign(
                    [],
                    arr.concat(traverseTree(newTreeDataList, key)),
                )
            })
        }
        return arr
    }

    return (
        <div className={styles.editDirMoveWrapper} hidden={!visible}>
            <Modal
                open={visible}
                title={title}
                width={480}
                getContainer={false}
                maskClosable={false}
                destroyOnClose
                className={styles.editDirModal}
                style={{
                    height: '560px',
                }}
                bodyStyle={{
                    padding: '16px 24px 8px',
                    // height: '540px',
                    overflow: 'scroll',
                }}
                onOk={() => handleMove()}
                onCancel={() => handleCancel()}
                // okButtonProps={{
                //     loading: uploading,
                // }}
                okButtonProps={{
                    disabled:
                        !checkedKey ||
                        checkedKey.length === 0 ||
                        !checkedKey[0],
                    loading: okLoading,
                }}
                centered
            >
                {errorText && (
                    <div className={styles.error}>
                        <ExclamationCircleFilled className={styles.errorIcon} />
                        <div className={styles.errorText}> {errorText}</div>
                    </div>
                )}
                <div className={styles.moveToBody}>
                    <div className={styles.moveToHeader}>
                        <SearchInput
                            placeholder="搜索目录名称"
                            value={searchKey}
                            onKeyChange={(kw: string) => {
                                setSearchKey(kw)
                                handleSearchPressEnter(kw)
                            }}
                            onPressEnter={handleSearchPressEnter}
                            maxLength={64}
                        />
                        <p className={styles.searchTitle}>
                            {searchKey ? '搜索结果' : '目录'}
                        </p>
                    </div>
                    <div className={styles.moveToDir} hidden={loading}>
                        <Tree
                            onExpand={onExpand}
                            autoExpandParent={autoExpandParent}
                            checkable
                            checkStrictly
                            onCheck={onCheck}
                            checkedKeys={checkedKey}
                            defaultExpandedKeys={[rootId]}
                            expandedKeys={expandedKeys}
                            switcherIcon={<PullDownOutlined />}
                            className={styles.movetoTree}
                        >
                            {treeData?.length > 0 && renderTreeNodes(treeData)}
                        </Tree>
                    </div>
                    <div
                        className={styles.showEmpty}
                        hidden={loading || treeData?.length !== 0}
                    >
                        <Empty />
                    </div>
                </div>
            </Modal>
            <div className={styles.showEmpty} hidden={!loading}>
                <Loader />
            </div>
        </div>
    )
}

export default EditDirModal
