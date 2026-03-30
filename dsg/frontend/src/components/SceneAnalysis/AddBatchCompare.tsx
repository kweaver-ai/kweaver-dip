import { Modal, ModalProps, Tooltip, List, Checkbox, Button } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import __ from './locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FontIcon } from '@/icons'
import Icons from '@/components/BussinessConfigure/Icons'
import { Empty, SearchInput } from '@/ui'
import { IconType } from '@/icons/const'

const EmptyView = (search: boolean) => {
    return search ? (
        <Empty iconHeight={100} desc={__('抱歉，没有找到相关内容')} />
    ) : (
        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
    )
}

const CatalogItem = (props: any) => {
    const {
        child,
        selected,
        checked,
        onCheck,
        isCheckedbox,
        handleChangeCheckbox,
    } = props
    return (
        <div
            className={classnames({
                [styles['catalog-item']]: true,
                [styles['is-selected']]: selected,
                [styles['is-checked']]: checked,
            })}
        >
            {handleChangeCheckbox && (
                <Tooltip title={child.disabled ? __('已存在此比对项') : null}>
                    <Checkbox
                        disabled={child.disabled}
                        checked={child.disabled ? true : isCheckedbox}
                        style={{ marginRight: 12 }}
                        onChange={(e) => handleChangeCheckbox(e, child)}
                    />
                </Tooltip>
            )}
            <div
                className={styles['catalog-item-icon']}
                onClick={() => !selected && onCheck?.(!checked, child)}
            >
                <Icons type={child.type} />
            </div>
            <div
                className={styles['catalog-item-title']}
                onClick={() => !selected && onCheck?.(!checked, child)}
            >
                <div
                    title={child?.alias}
                    className={styles['catalog-item-title-name']}
                >
                    {child?.alias}
                </div>
                <div
                    title={child?.enName}
                    className={styles['catalog-item-title-code']}
                >
                    {child?.enName}
                </div>
            </div>
        </div>
    )
}

interface IChooseLogicalView extends ModalProps {
    open: boolean
    checkedId?: string
    onClose: () => void
    onSure: (checkedItems: any[]) => void
    dataSource: any[]
    fieldsData: any
    benchmark?: string
    defaultValue?: any
}
/**
 * 批量添加比对项
 */
const AddBatchCompare: React.FC<IChooseLogicalView> = ({
    open,
    checkedId,
    onClose,
    onSure,
    dataSource,
    fieldsData,
    benchmark,
    defaultValue = [],
    ...props
}) => {
    const [data, setData] = useState<any[]>([])
    const [selectedNode, setSelectedNode] = useState<any>()
    const [searchNode, setSearchNode] = useState<string>()
    const [searchValue, setSearchValue] = useState<string>()
    const [checkedItem, setCheckedItem] = useState<any[]>([])

    useEffect(() => {
        if (open && dataSource.length && fieldsData?.data?.length) {
            setData(dataSource)
            setSelectedNode(dataSource[0])
        } else {
            setData([])
            setSearchNode('')
            setSelectedNode(undefined)
            setSearchValue('')
            setCheckedItem([])
        }
    }, [dataSource, defaultValue, fieldsData?.data, open])

    const onCheckAllChange = (item, e: CheckboxChangeEvent) => {
        const realFields = showFields.filter((f) => !f.disabled)
        if (e.target.checked) {
            setCheckedItem((prev) => [
                ...prev.filter(
                    (f) => !realFields.find((r) => r.value === f.value),
                ),
                ...realFields.map((r) => ({ ...r, nodeId: item.value })),
            ])
        } else {
            setCheckedItem((prev) =>
                prev.filter(
                    (f) => !realFields.find((r) => r.value === f.value),
                ),
            )
        }
    }

    const handleChangeCheckbox = (e, curr) => {
        if (e.target.checked) {
            setCheckedItem((prev) => [
                ...prev.filter((f) => curr.value !== f.value),
                { ...curr, nodeId: selectedNode.value },
            ])
        } else {
            setCheckedItem((prev) => prev.filter((f) => f.value !== curr.value))
        }
    }

    const showNode = useMemo(() => {
        if (!searchNode) return data
        return data.filter((item) =>
            item.label?.toLowerCase().includes(searchNode?.toLowerCase()),
        )
    }, [data, searchNode])

    const showFields = useMemo(() => {
        return selectedNode?.fields.filter(
            (child) =>
                child.alias
                    ?.toLowerCase()
                    .includes(searchValue?.toLowerCase()) ||
                child.enName
                    ?.toLowerCase()
                    .includes(searchValue?.toLowerCase()),
        )
    }, [searchValue, selectedNode])

    const nodeRender = (item) => {
        const isBenchmark = item.value === benchmark
        return (
            <div
                key={item.value}
                className={classnames(styles['add-batch-compare'], {
                    [styles.isSelected]: selectedNode?.value === item.value,
                })}
                onClick={() => setSelectedNode(item)}
            >
                <FontIcon
                    name="icon-zuzhijiegou2"
                    type={IconType.COLOREDICON}
                />
                <span
                    className={classnames(styles['add-batch-split'])}
                    title={item.label}
                >
                    {item.label}
                </span>
                {isBenchmark && (
                    <span className={styles.benchmarkNode}>{__('基准')}</span>
                )}
            </div>
        )
    }

    const itemRender = (child: any, item: any) => {
        return (
            <CatalogItem
                key={child.value}
                child={child}
                isCheckedbox={checkedItem.find((o) => o.value === child.value)}
                handleChangeCheckbox={handleChangeCheckbox}
            />
        )
    }

    const onCheckAll = () => {
        const realFields = showFields.filter((f) => !f.disabled)
        if (realFields.length === 0) return false
        return realFields.every((f) =>
            checkedItem.find((o) => o.value === f.value),
        )
    }

    const onIndeterminate = () => {
        const realFields = showFields.filter((f) => !f.disabled)
        if (realFields.length === 0) return false
        return (
            realFields.some((f) =>
                checkedItem.find((o) => o.value === f.value),
            ) && !onCheckAll()
        )
    }

    return (
        <Modal
            title={__('批量添加比对项')}
            width={1000}
            maskClosable={false}
            open={open}
            onCancel={onClose}
            destroyOnClose
            getContainer={false}
            bodyStyle={{ height: 534, padding: 0 }}
            footer={
                <div className={styles['compare-list-footer']}>
                    <Button onClick={onClose}>{__('取消')}</Button>
                    <Tooltip title={__('请先选择比对项')}>
                        <Button
                            type="primary"
                            onClick={() => onSure(checkedItem)}
                            disabled={checkedItem.length === 0}
                        >
                            {__('确定')}
                        </Button>
                    </Tooltip>
                </div>
            }
            {...props}
        >
            <div className={styles['compare-list']}>
                <div className={styles['compare-list-left']}>
                    <div className={styles['compare-list-left-top']}>
                        {__('输入节点')}
                    </div>
                    <div className={styles['compare-list-left-orgTree']}>
                        <div className={styles['compare-list-left-search']}>
                            <SearchInput
                                placeholder={__('搜索节点名称')}
                                value={searchNode}
                                onKeyChange={(value) => {
                                    if (value === searchNode) return
                                    setSearchNode(value)
                                }}
                            />
                        </div>
                        {showNode?.length ? (
                            <div
                                className={classnames(
                                    styles['compare-list-left-content'],
                                )}
                            >
                                <List
                                    dataSource={showNode}
                                    renderItem={nodeRender}
                                />
                            </div>
                        ) : (
                            EmptyView(!!searchNode)
                        )}
                    </div>
                </div>
                <div className={styles['compare-list-right']}>
                    <div className={styles['compare-list-right-title']}>
                        {__('选择比对项')}
                    </div>
                    {selectedNode && (
                        <div
                            className={classnames(
                                styles['compare-list-right-content'],
                            )}
                        >
                            <div
                                className={styles['compare-list-right-search']}
                            >
                                <Checkbox
                                    indeterminate={onIndeterminate()}
                                    checked={onCheckAll()}
                                    disabled={showFields.length === 0}
                                    onChange={(e) =>
                                        onCheckAllChange(selectedNode, e)
                                    }
                                >
                                    {__('全选')}
                                </Checkbox>
                                <SearchInput
                                    placeholder={__('搜索字段名称、英文名称')}
                                    style={{ width: '240px' }}
                                    value={searchValue}
                                    onKeyChange={(value) => {
                                        if (value === searchValue) return
                                        setSearchValue(value)
                                    }}
                                />
                            </div>
                            {showFields?.length > 0 ? (
                                <div
                                    className={styles['compare-list-right-box']}
                                >
                                    <List
                                        dataSource={showFields}
                                        renderItem={(child) =>
                                            itemRender(child, selectedNode)
                                        }
                                    />
                                </div>
                            ) : (
                                EmptyView(!!searchValue)
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default AddBatchCompare
