import React, { useEffect, useState } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { TreeSelect, TreeSelectProps } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import { formatError, getSSZDOrganization, ISSZDOrganization } from '@/core'
import { BusinessSystemOutlined } from '@/icons'

interface IOrganInfo {
    id: string
    name: string
}
interface IBusinessDomainSelect {
    placeholder?: string
    value?: IOrganInfo
    onChange?: (params: IOrganInfo) => void
    getTreeData?: (td: ISSZDOrganization[]) => void
}

const BusinessDomainSelect: React.FC<IBusinessDomainSelect> = ({
    placeholder,
    value,
    onChange,
    getTreeData,
}) => {
    const [val, setVal] = useState<IOrganInfo>({ id: '', name: '' })
    const [treeData, setTreeData] = useState<ISSZDOrganization[]>([])

    useEffect(() => {
        getTreeData?.(treeData)
    }, [treeData])

    useEffect(() => {
        if (value) {
            setVal(value)
        }
    }, [value])

    // 获取数据
    const getData = async (id: string) => {
        try {
            const res = await getSSZDOrganization(id)
            setTreeData(
                res?.entries.map((item) => ({
                    ...item,
                    // isLeaf: !item.expand,
                    id: item.code,
                    pId: id,
                    title: (
                        <span
                            style={{ display: 'inline-block', width: '100%' }}
                            title={item.name}
                        >
                            <BusinessSystemOutlined
                                className={styles['domain-type-icon']}
                            />
                            {item.name}
                        </span>
                    ),
                })),
            )
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getData('')
    }, [])

    const onLoadData: TreeSelectProps['loadData'] = async ({ code }) => {
        const res = await getSSZDOrganization(code)
        setTreeData(
            treeData.concat([
                ...res.entries.map((item) => ({
                    ...item,
                    pId: code,
                    id: item.code,
                    // isLeaf: !item.expand,
                    title: (
                        <span
                            style={{ display: 'inline-block', width: '100%' }}
                            title={item.name}
                        >
                            <BusinessSystemOutlined
                                className={styles['domain-type-icon']}
                            />
                            {item.name}
                        </span>
                    ),
                })),
            ]),
        )
    }

    const handleChange = (newValue: string, label: any, extra: any) => {
        setVal({
            id: newValue,
            name: label[0].props.title,
        })
        onChange?.({
            id: newValue,
            name: label[0].props.title,
        })
    }
    return (
        <div className={styles['province-org-tree-select-wrapper']}>
            <TreeSelect
                treeDataSimpleMode
                style={{ width: '100%' }}
                popupClassName={styles['common-tree-select']}
                value={val.id || undefined}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder={placeholder || __('请选择')}
                getPopupContainer={(node) => node.parentNode}
                switcherIcon={<DownOutlined />}
                onChange={handleChange}
                loadData={onLoadData}
                treeData={treeData}
                fieldNames={{ value: 'code' }}
                allowClear
            />
        </div>
    )
}
export default BusinessDomainSelect
