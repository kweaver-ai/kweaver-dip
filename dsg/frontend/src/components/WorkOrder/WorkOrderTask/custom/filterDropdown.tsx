import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Input, Row, Space } from 'antd'
import { useSelections } from 'ahooks'
import { SearchOutlined } from '@ant-design/icons'
import { trim } from 'lodash'
import styles from './styles.module.less'
import { deadlineInfos, statusInfos } from '../const'
import { StatusLabel } from './StatusComponent'
import { PriorityLabel } from '../components/PrioritySelect'
import { ExecutorLabel } from './ExecutorComponent'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { TaskTypeContent } from './taskTypeComponent'
import __ from '../locale'
import { noExecutorAssigned, taskPriorityInfos } from '../components/helper'
import { ExecutorInfo } from '@/core/apis/taskCenter/index.d'
import { SearchInput } from '@/ui'

interface IStatusFilter {
    list: any[]
    selectedList: any[]
    onSure: (selected: any[]) => void
}
/**
 * 表格状态筛选组件
 * @param list 筛选项
 * @param selectedList 已选值
 */
export const StatusFilter: React.FC<IStatusFilter> = ({
    list,
    selectedList,
    onSure,
}) => {
    const [sel, setSel] = useState(selectedList)
    const {
        allSelected,
        partiallySelected,
        isSelected,
        setSelected,
        toggle,
        toggleAll,
    } = useSelections(list, selectedList)

    useEffect(() => {
        setSel(selectedList)
        setSelected(selectedList)
    }, [])

    // 全选按钮click
    const handleCheckAll = () => {
        toggleAll()
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    // 单个按钮click
    const handleCheckSingle = (value: string) => {
        toggle(value)
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    return (
        <div className={styles.filterDropdownWrapper}>
            <div className={styles.checkAllWrapper} onClick={handleCheckAll}>
                <Space size={14}>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={partiallySelected}
                    />
                    <span className={styles.checkAllText}>{__('全部')}</span>
                </Space>
            </div>
            {list.map((l) => {
                const info = statusInfos.filter((s) => s.value === l)[0]
                return (
                    <Row
                        className={styles.rowWrapper}
                        style={{
                            backgroundColor: isSelected(l)
                                ? 'rgba(18, 110, 227, 0.06)'
                                : undefined,
                        }}
                        onClick={() => handleCheckSingle(l)}
                        key={info.value}
                    >
                        <Space size={12}>
                            <Checkbox checked={isSelected(l)} />
                            <StatusLabel
                                label={info.label}
                                color={info.color}
                                bgColor={info.backgroundColor}
                            />
                        </Space>
                    </Row>
                )
            })}
            <div className={styles.footerWrapper}>
                <Button
                    className={styles.okBtn}
                    type="primary"
                    onClick={() => {
                        onSure(sel)
                    }}
                >
                    {__('确定')}
                </Button>
            </div>
        </div>
    )
}

/**
 * 表格任务类型筛选组件
 * @param list 筛选项
 * @param selectedList 已选值
 */
export const TaskTypeFilter: React.FC<IStatusFilter> = ({
    list,
    selectedList,
    onSure,
}) => {
    const [sel, setSel] = useState(selectedList)
    const {
        allSelected,
        partiallySelected,
        setSelected,
        isSelected,
        toggle,
        toggleAll,
    } = useSelections(list, sel)

    useEffect(() => {
        setSel(selectedList)
        setSelected(selectedList)
    }, [])

    // 全选按钮click
    const handleCheckAll = () => {
        toggleAll()
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    // 单个按钮click
    const handleCheckSingle = (value: string) => {
        toggle(value)
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    return (
        <div className={styles.filterDropdownWrapper}>
            <div className={styles.checkAllWrapper} onClick={handleCheckAll}>
                <Space size={14}>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={partiallySelected}
                    />
                    <span className={styles.checkAllText}>{__('全部')}</span>
                </Space>
            </div>
            <div className={styles.executorWrapper}>
                {list.map((l) => {
                    return (
                        <Row
                            className={styles.rowWrapper}
                            style={{
                                backgroundColor: isSelected(l)
                                    ? 'rgba(18, 110, 227, 0.06)'
                                    : undefined,
                            }}
                            onClick={() => handleCheckSingle(l)}
                            key={l}
                        >
                            <Space size={12}>
                                <Checkbox checked={isSelected(l)} />
                                <TaskTypeContent label={l} />
                            </Space>
                        </Row>
                    )
                })}
            </div>
            <div className={styles.footerWrapper}>
                <Button
                    className={styles.okBtn}
                    type="primary"
                    onClick={() => {
                        onSure(sel)
                    }}
                >
                    {__('确定')}
                </Button>
            </div>
        </div>
    )
}

/**
 * 表格逾期筛选组件
 * @param list 筛选项
 * @param selectedList 已选值
 */
export const DeadlineFilter: React.FC<IStatusFilter> = ({
    list,
    selectedList,
    onSure,
}) => {
    const [sel, setSel] = useState(selectedList)
    const {
        allSelected,
        partiallySelected,
        isSelected,
        setSelected,
        toggle,
        toggleAll,
    } = useSelections(list, selectedList)

    useEffect(() => {
        setSel(selectedList)
        setSelected(selectedList)
    }, [])

    // 全选按钮click
    const handleCheckAll = () => {
        toggleAll()
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    // 单个按钮click
    const handleCheckSingle = (value: string) => {
        toggle(value)
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    return (
        <div className={styles.filterDropdownWrapper}>
            <div className={styles.checkAllWrapper} onClick={handleCheckAll}>
                <Space size={14}>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={partiallySelected}
                    />
                    <span className={styles.checkAllText}>{__('全部')}</span>
                </Space>
            </div>
            {list.map((l) => {
                const info = deadlineInfos.filter((s) => s.value === l)[0]
                return (
                    <Row
                        className={styles.rowWrapper}
                        style={{
                            backgroundColor: isSelected(l)
                                ? 'rgba(18, 110, 227, 0.06)'
                                : undefined,
                        }}
                        onClick={() => handleCheckSingle(l)}
                    >
                        <Space size={12}>
                            <Checkbox checked={isSelected(l)} />
                            <span className={styles.text}>{info.label}</span>
                        </Space>
                    </Row>
                )
            })}
            <div className={styles.footerWrapper}>
                <Button
                    className={styles.okBtn}
                    type="primary"
                    onClick={() => {
                        onSure(sel)
                    }}
                >
                    {__('确定')}
                </Button>
            </div>
        </div>
    )
}

/**
 * 表格优先级筛选组件
 * @param list 筛选项
 * @param selectedList 已选值
 */
export const PriorityFilter: React.FC<IStatusFilter> = ({
    list,
    selectedList,
    onSure,
}) => {
    const [sel, setSel] = useState(selectedList)
    const {
        allSelected,
        partiallySelected,
        setSelected,
        isSelected,
        toggle,
        toggleAll,
    } = useSelections(list, sel)

    useEffect(() => {
        setSel(selectedList)
        setSelected(selectedList)
    }, [])

    // 全选按钮click
    const handleCheckAll = () => {
        toggleAll()
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    // 单个按钮click
    const handleCheckSingle = (value: string) => {
        toggle(value)
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    return (
        <div className={styles.filterDropdownWrapper}>
            <div className={styles.checkAllWrapper} onClick={handleCheckAll}>
                <Space size={14}>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={partiallySelected}
                    />
                    <span className={styles.checkAllText}>{__('全部')}</span>
                </Space>
            </div>
            {list.map((l) => {
                const info = taskPriorityInfos[l]
                return (
                    <Row
                        className={styles.rowWrapper}
                        style={{
                            backgroundColor: isSelected(l)
                                ? 'rgba(18, 110, 227, 0.06)'
                                : undefined,
                        }}
                        onClick={() => handleCheckSingle(l)}
                        key={info.value}
                    >
                        <Space size={12}>
                            <Checkbox checked={isSelected(l)} />
                            <PriorityLabel
                                label={info.label}
                                color={info.color}
                            />
                        </Space>
                    </Row>
                )
            })}
            <div className={styles.footerWrapper}>
                <Button
                    className={styles.okBtn}
                    type="primary"
                    onClick={() => {
                        onSure(sel)
                    }}
                >
                    {__('确定')}
                </Button>
            </div>
        </div>
    )
}

interface IExecutorFilter {
    infoList: ExecutorInfo[]
    selectedList: string[]
    onSure: (selected: string[]) => void
}
/**
 * 表格执行人筛选组件
 * @param infoList 筛选项
 * @param selectedList 已选值
 */
export const ExecutorFilter: React.FC<IExecutorFilter> = ({
    infoList,
    selectedList,
    onSure,
}) => {
    // 默认执行人id集
    const defaultList = infoList.map((info) => info.id)

    // 执行人id集
    const [list, setList] = useState<string[]>(defaultList)

    const [sel, setSel] = useState(selectedList)

    const {
        allSelected,
        noneSelected,
        partiallySelected,
        setSelected,
        isSelected,
        toggle,
        toggleAll,
        unSelectAll,
    } = useSelections(list, selectedList)

    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')

    useEffect(() => {
        setSearchKey('')
        setList(defaultList)
        setSel(selectedList)
        setSelected(selectedList)
    }, [])

    // 全选按钮click
    const handleCheckAll = () => {
        toggleAll()
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    // 单个按钮click
    const handleCheckSingle = (value: string) => {
        toggle(value)
        const selectedArr = list.filter((l) => isSelected(l))
        setSel(selectedArr)
    }

    // 重置click
    const handleReset = () => {
        unSelectAll()
        setSel([])
    }

    // 搜索框enter
    const handleSearchPressEnter = (value: string) => {
        setSearchKey(value)
        if (value === '') {
            setList(defaultList)
            return
        }
        const res = infoList
            .filter((info) => info.name && info.name.includes(value))
            .map((info) => info.id)
        setList(res)
    }

    return (
        <div className={styles.filterDropdownWrapper} style={{ width: 200 }}>
            <div className={styles.searchWrapper}>
                <SearchInput
                    placeholder={__('在筛选项中搜索')}
                    value={searchKey}
                    onKeyChange={handleSearchPressEnter}
                    maxLength={32}
                />
            </div>
            <div
                className={styles.checkAllWrapper}
                onClick={handleCheckAll}
                hidden={list.length === 0}
            >
                <Space size={14}>
                    <Checkbox
                        checked={allSelected}
                        indeterminate={partiallySelected}
                    />
                    <span className={styles.checkAllText}>{__('全部')}</span>
                </Space>
            </div>
            <div className={styles.executorWrapper} hidden={list.length === 0}>
                {list.map((l) => {
                    const info = infoList.filter((s) => s.id === l)[0]
                    return (
                        <Row
                            className={styles.rowWrapper}
                            style={{
                                backgroundColor: isSelected(l)
                                    ? 'rgba(18, 110, 227, 0.06)'
                                    : undefined,
                            }}
                            title={info.name}
                            onClick={() => handleCheckSingle(l)}
                            key={info.id}
                        >
                            <Space size={12}>
                                <Checkbox checked={isSelected(l)} />
                                <ExecutorLabel
                                    label={info.name || ''}
                                    icon={info.id !== noExecutorAssigned.id}
                                />
                            </Space>
                        </Row>
                    )
                })}
            </div>
            <div
                hidden={defaultList.length === 0 || list.length > 0}
                className={styles.searchEmpty}
            >
                {__('抱歉，没有找到相关内容')}
            </div>
            <div hidden={defaultList.length > 0}>
                <Empty
                    iconSrc={dataEmpty}
                    desc={__('暂无数据')}
                    style={{ marginTop: -40 }}
                />
            </div>
            <div className={styles.footerWrapper}>
                <Space size={12}>
                    <div
                        className={styles.resetText}
                        onClick={handleReset}
                        style={{
                            color: noneSelected
                                ? 'rgba(0, 0, 0, 0.45)'
                                : 'rgba(52, 97, 236, 0.75)',
                            cursor: noneSelected ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {__('重置')}
                    </div>
                    <Button
                        className={styles.okBtn}
                        type="primary"
                        onClick={() => {
                            onSure(sel)
                        }}
                    >
                        {__('确定')}
                    </Button>
                </Space>
            </div>
        </div>
    )
}
