import { DownOutlined, SyncOutlined } from '@ant-design/icons'
import { Tree, message } from 'antd'
import React, { Key, useEffect, useState } from 'react'
import styles from './styles.module.less'
import { ISSZDOrganization, getSSZDOrganization } from '@/core'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

type DataNode = ISSZDOrganization & any
const updateTreeData = (
    list: DataNode[],
    key: React.Key,
    children: DataNode[],
): DataNode[] =>
    list.map((node) => {
        if (node.code === key) {
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

interface IProvinceOrganTree {
    initData?: DataNode[]
    // 指定根节点code——省直达联调需要
    rootCode?: string
    getSelectedNode?: (code: string, nodeData: ISSZDOrganization) => void
}
const ProvinceOrganTree = ({
    initData = [],
    rootCode,
    getSelectedNode,
}: IProvinceOrganTree) => {
    const [treeData, setTreeData] = useState(initData)
    const [loadingKey, setLoadingKey] = useState('')
    const [loading, setLoading] = useState(false)
    const [selectedKeys, setSelectedKeys] = useState<Key[]>([])

    const getData = async (key: string) => {
        try {
            setLoading(true)
            const res = await getSSZDOrganization(key)
            if (!key || key === rootCode) {
                setTreeData(res.entries)
                setSelectedKeys([res.entries[0].code])
                getSelectedNode?.(res.entries[0].code, res.entries[0])
            } else {
                setTreeData((origin) =>
                    updateTreeData(origin, key, res.entries),
                )
            }
        } catch (error) {
            setTreeData((origin) =>
                updateTreeData(origin, key, [
                    {
                        name: '',
                        code: `${key}-0`,
                        origin,
                        pKey: key,
                        isLeaf: true,
                        disabled: true,
                    },
                ]),
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!initData || initData.length === 0) {
            getData(rootCode || '')
        } else {
            getSelectedNode?.(initData[0].code, initData[0])
            setSelectedKeys([initData[0].code])
        }
    }, [])

    const onLoadData = async ({ key, children }: any) => {
        if (children) {
            return Promise.resolve()
        }
        await getData(key)
        return Promise.resolve()
    }

    const titleRender = (nodeData: DataNode) => {
        if (nodeData.origin) {
            return (
                <div className={styles['load-fail-container']}>
                    加载失败，点击
                    <a
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setLoadingKey(nodeData.pKey)
                            getData(nodeData.pKey)
                        }}
                    >
                        &nbsp;重试
                    </a>
                    {loadingKey === nodeData.pKey && loading && (
                        <SyncOutlined spin className={styles['loading-icon']} />
                    )}
                </div>
            )
        }
        return (
            <div className={styles.title} key={nodeData.code}>
                <FontIcon
                    type={IconType.FONTICON}
                    name={
                        nodeData.org_type === 'organ'
                            ? 'icon-shengzhengfu'
                            : 'icon-hangzhengqu'
                    }
                    style={{ marginRight: 8 }}
                />
                {nodeData.name}
            </div>
        )
    }

    const handleSelect = (sKeys: Key[], node) => {
        getSelectedNode?.(sKeys[0] as string, node.selectedNodes[0])
        setSelectedKeys(sKeys)
    }

    return (
        <Tree
            loadData={onLoadData}
            selectedKeys={selectedKeys}
            treeData={treeData}
            showIcon
            switcherIcon={<DownOutlined />}
            className={styles['province-org-tree']}
            blockNode
            titleRender={titleRender}
            fieldNames={{ title: 'name', key: 'code' }}
            onSelect={handleSelect}
        />
    )
}

export default ProvinceOrganTree
