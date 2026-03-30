import React, { useEffect, useState } from 'react'
import { Modal } from 'antd'
import __ from './locale'
import { SortableTree } from './Tree/SortableTree'
import { ICategoryItem } from '@/core'

interface IConfigTree {
    // 显示/隐藏
    visible: boolean
    // 类目
    item?: ICategoryItem
    onClose: () => void
}

/**
 * 配置类目树
 */
const ConfigTree: React.FC<IConfigTree> = ({ visible, item, onClose }) => {
    const [category, setCategory] = useState<ICategoryItem>()
    const [configed, setConfiged] = useState<boolean>(false)

    useEffect(() => {
        if (visible) {
            setCategory(item)
        }
    }, [visible])

    return (
        <Modal
            title={__('配置类目树')}
            width={1000}
            maskClosable={false}
            open={visible}
            onCancel={onClose}
            destroyOnClose
            getContainer={false}
            bodyStyle={{ height: '545px', padding: '0' }}
            footer={false}
        >
            <SortableTree
                category={category!}
                onConfiged={() => setConfiged(true)}
            />
        </Modal>
    )
}

export default ConfigTree
