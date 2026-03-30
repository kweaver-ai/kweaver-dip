import React, { useEffect, useState } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { TreeSelect, TreeSelectProps } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'
import {
    BusinessDomainLevelTypes,
    formatError,
    getBusinessDomainTree,
    IBusinessDomainItem,
    IBusinessDomainTreeParams,
} from '@/core'
import { UNGROUPED } from './const'

interface IDisable {
    disable: boolean
    message: string
}
interface IBusinessDomainSelect {
    placeholder?: string
    isShowProcess?: boolean
    getDisabledNode?: (node: IBusinessDomainItem) => IDisable
    value?: string | string[]
    onChange?: (val: string | string[]) => void
    getTreeData?: (td: IBusinessDomainItem[]) => void
    initTreeNode?: IBusinessDomainItem
    disabled?: boolean
    multiple?: boolean // 是否支持多选
}

const BusinessDomainSelect: React.FC<IBusinessDomainSelect> = ({
    placeholder,
    isShowProcess = true,
    getDisabledNode,
    value,
    onChange,
    getTreeData,
    initTreeNode,
    disabled = false,
    multiple = false,
}) => {
    const [val, setVal] = useState<string>()
    const [valMultiple, setValMultiple] = useState<string[]>([])
    const [treeData, setTreeData] = useState<IBusinessDomainItem[]>([])

    useEffect(() => {
        getTreeData?.(treeData)
    }, [treeData])

    useEffect(() => {
        if (value) {
            if (multiple) {
                setValMultiple(value as string[])
            } else {
                setVal(value as string)
            }
        }
    }, [value])

    // 获取数据
    const getData = async (params: Partial<IBusinessDomainTreeParams>) => {
        try {
            const res = await getBusinessDomainTree(params)
            setTreeData(
                res?.entries.map((item) => ({
                    ...item,
                    isLeaf: !item.expand,
                    pId: '',
                    title: (
                        <span
                            title={
                                getDisabledNode
                                    ? getDisabledNode(item).message || item.name
                                    : item.name
                            }
                        >
                            <BusinessDomainLevelIcon
                                isColored
                                type={item.type}
                                className={styles['domain-type-icon']}
                            />
                            {item.name}
                        </span>
                    ),
                    selectable: getDisabledNode
                        ? !getDisabledNode(item).disable
                        : true,
                })),
            )
        } catch (error) {
            formatError(error)
        }
    }

    const generateRootData = () => {
        if (!initTreeNode) return
        setTreeData([
            {
                ...initTreeNode,
                isLeaf: !initTreeNode.expand,
                pId: '',
                children: undefined,
                title: (
                    <span
                        title={
                            getDisabledNode
                                ? getDisabledNode(initTreeNode).message
                                : initTreeNode.name
                        }
                    >
                        <BusinessDomainLevelIcon
                            isColored
                            type={initTreeNode.type}
                            className={styles['domain-type-icon']}
                        />
                        {initTreeNode.name}
                    </span>
                ),
                selectable: getDisabledNode
                    ? !getDisabledNode(initTreeNode).disable
                    : true,
            } as IBusinessDomainItem,
        ])
    }
    useEffect(() => {
        if (!initTreeNode?.id || initTreeNode?.id === UNGROUPED) {
            getData({})
        } else {
            generateRootData()
        }
    }, [initTreeNode])

    const onLoadData: TreeSelectProps['loadData'] = async ({ id }) => {
        const res = await getBusinessDomainTree({
            parent_id: id,
            getall: isShowProcess,
        })

        setTreeData(
            treeData.concat([
                ...res.entries.map((item) => ({
                    ...item,
                    pId: id,
                    isLeaf: !item.expand,
                    title: (
                        <span
                            title={
                                getDisabledNode
                                    ? getDisabledNode(item).message || item.name
                                    : item.name
                            }
                        >
                            <BusinessDomainLevelIcon
                                isColored
                                type={item.type}
                                className={styles['domain-type-icon']}
                            />
                            {item.name}
                        </span>
                    ),
                    selectable: getDisabledNode
                        ? !getDisabledNode(item).disable
                        : true,
                })),
            ]),
        )
    }

    const handleChange = (newValue: string | string[]) => {
        if (multiple) {
            setValMultiple(newValue as string[])
        } else {
            setVal(newValue as string)
        }
        onChange?.(newValue)
    }
    return (
        <div className={styles['business-domain-tree-select-wrapper']}>
            <TreeSelect
                multiple={multiple}
                treeDataSimpleMode
                style={{ width: '100%' }}
                popupClassName={styles['common-tree-select']}
                value={multiple ? valMultiple : val}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder={placeholder || __('请选择所属业务领域')}
                getPopupContainer={(node) => node.parentNode}
                switcherIcon={<DownOutlined />}
                onChange={handleChange}
                loadData={onLoadData}
                treeData={treeData}
                fieldNames={{ value: 'id' }}
                disabled={disabled}
                allowClear
            />
        </div>
    )
}
export default BusinessDomainSelect
