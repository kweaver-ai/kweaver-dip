import { Dropdown, Tree, Button } from 'antd'
import React, { useEffect, useMemo, useState } from 'react'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import { getObjects, IObject } from '@/core'
import { Architecture } from '../BusinessArchitecture/const'

interface DataNode {
    title: string
    key: string
    isLeaf?: boolean
    children?: DataNode[]
}

const updateTreeData = (
    list: DataNode[],
    key: React.Key,
    children: DataNode[],
): DataNode[] =>
    list.map((node) => {
        if (node.key === key) {
            return {
                ...node,
                children,
            }
        }
        if (node.children) {
            return {
                ...node,
                children: updateTreeData(node.children, key, children),
            }
        }
        return node
    })

interface IDepartmentMultipleChoicesProps {
    onChange: (value: string[]) => void
}

const DepartmentMultipleChoices = ({
    onChange,
}: IDepartmentMultipleChoicesProps) => {
    const [expandedKeys, setExpandedKeys] = useState([])
    const [checkedKeys, setCheckedKeys] = useState<string[]>([])
    // const [selectedKeys, setSelectedKeys] = useState([])
    const [autoExpandParent, setAutoExpandParent] = useState(true)

    const [allDepartmentData, setAllDepartmentData] = useState<DataNode[]>([])
    const [treeData, setTreeData] = useState<DataNode[]>([])
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const depNames = useMemo(() => {
        return allDepartmentData
            .filter((department) => {
                return checkedKeys.includes(department.key)
            })
            .map((department) => department.title)
            .join(',')
    }, [allDepartmentData, checkedKeys])

    const getTreeData = async () => {
        const { entries } = await getObjects({
            is_all: false,
            id: '',
            type: `${Architecture.ORGANIZATION},${Architecture.DEPARTMENT}`,
            limit: 0,
        })
        const data = [
            ...entries.map((o) => ({
                title: o.name,
                key: o.id,
                isLeaf: !o.expand,
            })),
            {
                title: '未分类',
                key: '00000000-0000-0000-0000-000000000000',
                isLeaf: true,
            },
        ]
        setTreeData(data)
        setAllDepartmentData(data)
    }

    const onLoadData = async ({ key, children }: any) => {
        if (children) {
            return Promise.resolve()
        }
        const { entries } = await getObjects({
            is_all: false,
            id: key,
            type: `${Architecture.ORGANIZATION},${Architecture.DEPARTMENT}`,
            limit: 0,
        })
        const data = entries.map((o) => ({
            title: o.name,
            key: o.id,
            isLeaf: !o.expand,
        }))
        setTreeData((origin) => updateTreeData(origin, key, data))
        setAllDepartmentData([...allDepartmentData, ...data])
        return Promise.resolve()
    }

    useEffect(() => {
        getTreeData()
    }, [])

    const onExpand = (expandedKeysValue) => {
        setExpandedKeys(expandedKeysValue)
        setAutoExpandParent(false)
    }

    const onCheck = (checkedKeysValue) => {
        setCheckedKeys(checkedKeysValue.checked)
        onChange?.(checkedKeysValue.checked)
    }

    const onOpenChange = (open) => {
        setDropdownOpen(open)
    }

    const getPopupRender = () => {
        return (
            <div className={styles['dep-multiple-choices-popup-container']}>
                <div className={styles['popup-header']}>
                    <div>筛选</div>
                    <Button
                        type="link"
                        onClick={() => {
                            setCheckedKeys([])
                            onChange?.([])
                        }}
                    >
                        重置
                    </Button>
                </div>
                <Tree
                    checkable
                    onExpand={onExpand}
                    expandedKeys={expandedKeys}
                    autoExpandParent={autoExpandParent}
                    onCheck={onCheck}
                    checkedKeys={checkedKeys}
                    treeData={treeData}
                    loadData={onLoadData}
                    checkStrictly
                />
            </div>
        )
    }

    return (
        <Dropdown
            dropdownRender={getPopupRender}
            trigger={['click']}
            placement="bottomLeft"
            getPopupContainer={(node) => node.parentNode as HTMLElement}
            onOpenChange={onOpenChange}
        >
            <div className={styles['main-area']} title={depNames}>
                <div className={styles['dep-names']}>
                    {depNames ? `已选：${depNames}` : '部门不限'}
                </div>
                {dropdownOpen ? (
                    <UpOutlined className={styles['arrow-icon']} />
                ) : (
                    <DownOutlined className={styles['arrow-icon']} />
                )}
            </div>
        </Dropdown>
    )
}

export default DepartmentMultipleChoices
