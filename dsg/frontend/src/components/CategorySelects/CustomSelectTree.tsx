import { useEffect } from 'react'
import { DownOutlined, FolderFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import { Form, TreeSelect } from 'antd'
import __ from './locale'

interface ICustomSelectTreeProps {
    treeData: any[]
    value?: {
        category_node_id: string
        category_id: string
    }
    onChange?: (value: {
        category_node_id: string
        category_id: string
    }) => void
    placeholder?: string
    category_id: string
    onDataNotFind?: () => void
    onNotThisCategory?: () => void
}

const CustomSelectTree = ({
    treeData,
    value,
    onChange = noop,
    placeholder = __('请选择'),
    category_id,
    onDataNotFind = noop,
    onNotThisCategory = noop,
}: ICustomSelectTreeProps) => {
    /**
     * 递归查找节点
     * @param list 节点列表
     * @param category_node_id 节点id
     * @returns 节点
     */
    const findCategoryNode = (list: any[], category_node_id: string) => {
        const findData = list?.find((it) => it.id === category_node_id)
        if (findData) {
            return findData
        }
        let childFindData
        list?.forEach((it) => {
            if (it?.children && !childFindData) {
                childFindData = findCategoryNode(it.children, category_node_id)
            }
        })
        return childFindData
    }

    useEffect(() => {
        if (!value?.category_id) {
            onChange({
                category_node_id: '',
                category_id,
            })
        } else if (
            value?.category_id &&
            value.category_id !== category_id &&
            category_id
        ) {
            onNotThisCategory()
        } else if (value?.category_node_id) {
            const findData = findCategoryNode(treeData, value?.category_node_id)
            if (!findData) {
                onDataNotFind()
            }
        }
    }, [treeData, value])

    return (
        <TreeSelect
            treeData={treeData}
            value={value?.category_node_id || null}
            fieldNames={{
                label: 'title',
                value: 'id',
            }}
            onChange={(current, node) => {
                onChange({
                    category_node_id: current || '',
                    category_id,
                })
            }}
            allowClear
            showSearch
            switcherIcon={<DownOutlined style={{ fontSize: '12px' }} />}
            filterTreeNode={(input, treeNode) => {
                return treeNode.name
                    .toLowerCase()
                    .includes(input.trim().toLowerCase())
            }}
            treeDefaultExpandAll
            treeNodeFilterProp="name"
            getPopupContainer={(node) => node || node.parentNode}
            placeholder={placeholder}
        />
    )
}

export default CustomSelectTree
