import React, { useEffect, useState } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { TreeSelect, TreeSelectProps } from 'antd'
import __ from './locale'
import BusinessDomainLevelIcon from '../BusinessDomainLevel/BusinessDomainLevelIcon'
import { formatError, getSubjectDomain } from '@/core'
import { BusinessDomainType } from '../BusinessDomain/const'
import styles from './styles.module.less'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'

const InitParams = { limit: 2000, parent_id: '', is_all: false }

interface IDisable {
    disable: boolean
    message: string
}
interface ISubjectDomainSelect {
    placeholder?: string
    getDisabledNode?: (node: any) => IDisable
    value?: string
    onChange?: (val: string) => void
    getTreeData?: (td: any[]) => void
    disabled?: boolean
}

const SubjectDomainSelect: React.FC<ISubjectDomainSelect> = ({
    placeholder,
    getDisabledNode,
    value,
    onChange,
    getTreeData,
    disabled = false,
}) => {
    const [val, setVal] = useState<string>()
    const [treeData, setTreeData] = useState<any[]>([])

    useEffect(() => {
        getTreeData?.(treeData)
    }, [treeData])

    useEffect(() => {
        if (value) {
            setVal(value)
        }
    }, [value])

    // 获取数据
    const getData = async () => {
        try {
            const res = await getSubjectDomain({ ...InitParams })
            setTreeData(
                res?.entries.map((item) => ({
                    ...item,
                    isLeaf: item.child_count === 0,
                    pId: '',
                    disabled: getDisabledNode
                        ? getDisabledNode(item).disable
                        : false,
                    title: (
                        <span
                            title={
                                getDisabledNode
                                    ? getDisabledNode(item).message
                                    : ''
                            }
                            className={styles['title-container']}
                        >
                            <GlossaryIcon
                                width="20px"
                                type={item.type}
                                fontSize="20px"
                                styles={{ marginRight: 6 }}
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
        getData()
    }, [])

    const onLoadData: TreeSelectProps['loadData'] = async ({ id }) => {
        const res = await getSubjectDomain({
            ...InitParams,
            parent_id: id,
        })

        setTreeData(
            treeData.concat([
                ...res.entries.map((item) => ({
                    ...item,
                    pId: id,
                    isLeaf:
                        item.child_count === 0 ||
                        item.type === BusinessDomainType.subject_domain,
                    title: (
                        <span
                            title={
                                getDisabledNode
                                    ? getDisabledNode(item).message
                                    : ''
                            }
                            className={styles['title-container']}
                        >
                            <GlossaryIcon
                                width="20px"
                                type={item.type}
                                fontSize="20px"
                                styles={{ marginRight: 6 }}
                            />
                            {item.name}
                        </span>
                    ),
                    disabled: getDisabledNode
                        ? getDisabledNode(item).disable
                        : false,
                })),
            ]),
        )
    }

    const handleChange = (newValue: string) => {
        setVal(newValue)
        onChange?.(newValue)
    }
    return (
        <div className={styles['subject-domain-tree-select-wrapper']}>
            <TreeSelect
                treeDataSimpleMode
                style={{ width: '100%' }}
                popupClassName={styles['common-tree-select']}
                value={val}
                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                placeholder={placeholder || __('请选择所属业务领域')}
                getPopupContainer={(node) => node.parentNode}
                switcherIcon={<DownOutlined />}
                onChange={handleChange}
                loadData={onLoadData}
                treeData={treeData}
                fieldNames={{
                    value: 'id',
                }}
                disabled={disabled}
                allowClear
            />
        </div>
    )
}
export default SubjectDomainSelect
