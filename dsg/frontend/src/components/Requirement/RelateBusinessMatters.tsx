import React, { useEffect, useState } from 'react'
import { Checkbox, Input, Modal } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useDebounce, useUpdateEffect } from 'ahooks'
import classnames from 'classnames'
import { trim } from 'lodash'
import ArchitectureTree from '../BusinessArchitecture/ArchitectureTree'
import { Architecture, DataNode } from '../BusinessArchitecture/const'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import empty from '@/assets/dataEmpty.svg'
import { formatError, getObjects, IObject } from '@/core'
import { BusinessMattersOutlined } from '@/icons'
import Loader from '@/ui/Loader'
import { SearchInput } from '@/ui'
import __ from './locale'

interface IRelateBusinessMatters {
    open: boolean
    selectedMattersIds: string[]
    onClose: () => void
    getSelectedMattersIds: (ids: string[]) => void
}
const RelateBusinessMatters: React.FC<IRelateBusinessMatters> = ({
    open,
    onClose,
    getSelectedMattersIds,
    selectedMattersIds,
}) => {
    const [searchValue, setSearchValue] = useState('')
    const [matters, setMatters] = useState<IObject[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [searchMatters, setSearchMatters] = useState<IObject[]>([])
    const [loading, setLoading] = useState(true)
    const [rightLoading, setRightLoading] = useState(false)

    useEffect(() => {
        // 弹窗关闭时取消搜索状态
        if (!open) {
            setSearchValue('')
        }
    }, [open])

    // 选中树节点后查询包含的业务事项
    const getSelectedNode = async (node: DataNode) => {
        try {
            setRightLoading(true)
            const res = await getObjects({
                id: node.id,
                is_all: true,
                type: Architecture.BMATTERS,
                limit: 0,
            })
            setMatters(res.entries)
            setRightLoading(false)
        } catch (error) {
            formatError(error)
            setRightLoading(false)
        }
    }

    // 搜索全部的业务事项
    const getSearchNode = async () => {
        try {
            setLoading(true)
            const res = await getObjects({
                id: '',
                is_all: true,
                type: Architecture.BMATTERS,
                limit: 0,
                keyword: searchValue,
            })
            setSearchMatters(res.entries)
            setLoading(false)
        } catch (error) {
            setLoading(false)
            formatError(error)
        }
    }

    useEffect(() => {
        if (!searchValue) {
            setSearchMatters([])
            setLoading(true)
            return
        }
        getSearchNode()
    }, [searchValue])

    useEffect(() => {
        setSelectedIds(selectedMattersIds)
    }, [selectedMattersIds])

    // 点击checkbox时 设置选中数据
    const onCheckMatter = (checked: boolean, matter: IObject) => {
        if (checked) {
            setSelectedIds([...selectedIds, matter.id])
        } else {
            setSelectedIds(selectedIds.filter((m) => m !== matter.id))
        }
    }

    // 获取选中状态
    const getCheckedStatus = (matter: IObject) => {
        return !!selectedIds.find((sid) => sid === matter.id)
    }

    // 清空选中状态
    const handleClear = () => {
        setSelectedIds([])
    }

    const handleOk = () => {
        getSelectedMattersIds(selectedIds)
        onClose()
    }

    const handleCancel = () => {
        // 取消时: 在全部的业务事项中将上一次选过的数据还原
        setSelectedIds(selectedMattersIds)
        onClose()
    }

    const getMatterItemComp = (ms: IObject[]) => {
        return ms.map((matter) => (
            <div
                className={classnames({
                    [styles.matterItem]: true,
                    [styles.selectedMatterItem]: getCheckedStatus(matter),
                })}
                key={matter.id}
            >
                <div className={styles.matterIconName}>
                    <BusinessMattersOutlined className={styles.matterIcon} />
                    <div className={styles.matterName}>{matter.name}</div>
                </div>
                <Checkbox
                    checked={getCheckedStatus(matter)}
                    onChange={(e) => onCheckMatter(e.target.checked, matter)}
                    className={styles.checkbox}
                />
            </div>
        ))
    }
    return (
        <Modal
            title={__('选择关联业务事项')}
            open={open}
            onCancel={handleCancel}
            width={640}
            getContainer={false}
            maskClosable={false}
            bodyStyle={{ minHeight: 444 }}
            onOk={handleOk}
            destroyOnClose
        >
            {open ? (
                <div className={styles.relateBusinessMatters}>
                    <SearchInput
                        placeholder={__('搜索业务事项名称')}
                        value={searchValue}
                        onKeyChange={(kw: string) => setSearchValue(kw)}
                    />
                    <div className={trim(searchValue) && styles.hiddenContent}>
                        <div className={styles.mattersCountWrapper}>
                            <span className={styles.mattersCount}>
                                {__('已选：')}
                                {selectedIds.length}
                            </span>
                            <span
                                className={styles.mattersClear}
                                onClick={handleClear}
                            >
                                {__('清空')}
                            </span>
                        </div>
                        <div className={styles.relateMattersContent}>
                            <div className={styles.leftTree}>
                                <div className={styles.leftTreeTitle}>
                                    {__('组织架构')}
                                </div>
                                <ArchitectureTree
                                    getSelectedNode={getSelectedNode}
                                    isShowAll
                                    isShowOperate={false}
                                    hiddenNodeTypeList={[
                                        Architecture.BMATTERS,
                                        Architecture.BSYSTEM,
                                        Architecture.COREBUSINESS,
                                    ]}
                                    initNodeType={`${Architecture.ORGANIZATION},${Architecture.DEPARTMENT}`}
                                    isShowXScroll
                                />
                            </div>
                            <div className={styles.rightMatterList}>
                                {rightLoading ? (
                                    <Loader />
                                ) : matters.length === 0 ? (
                                    <Empty
                                        iconSrc={empty}
                                        desc={__('暂无业务事项')}
                                    />
                                ) : (
                                    <>{getMatterItemComp(matters)}</>
                                )}
                            </div>
                        </div>
                    </div>
                    {!trim(searchValue) ? null : loading ? (
                        <div className={styles.loader}>
                            <Loader />
                        </div>
                    ) : (
                        <div
                            className={classnames({
                                [styles.hiddenContent]: !searchValue,
                                [styles.searchMattersContent]: true,
                            })}
                        >
                            <div className={styles.searchRes}>
                                {__('搜索结果')}
                            </div>
                            {searchMatters.length > 0 ? (
                                <div className={styles.searchMatterItem}>
                                    {getMatterItemComp(searchMatters)}
                                </div>
                            ) : (
                                <Empty />
                            )}
                        </div>
                    )}
                </div>
            ) : null}
        </Modal>
    )
}
export default RelateBusinessMatters
