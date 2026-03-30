import React, { useEffect, useState } from 'react'
import { message, Modal, TreeSelect } from 'antd'
import classnames from 'classnames'
import { DownOutlined } from '@ant-design/icons'
import { LevelTypeNameMap } from '../BusinessDomainLevel/const'
import __ from './locale'
import styles from './styles.module.less'
import BusinessDomainSelect from './BusinessDomainSelect'
import {
    BusinessDomainLevelTypes,
    formatError,
    IBusinessDomainItem,
    moveBusinessDomainTreeNode,
} from '@/core'
import { checkAuditProcess } from './helper'

const getNode = (tree: IBusinessDomainItem[], id: string) => {
    let node: IBusinessDomainItem
    tree?.forEach((item) => {
        if (item.id === id) {
            node = item
        }
        if (item.children) {
            getNode(item.children, id)
        }
    })
    return node!
}

interface IMove {
    open: boolean
    data: IBusinessDomainItem
    onClose: () => void
    domainLevels: BusinessDomainLevelTypes[]
    isBusinessArea?: boolean
    onOk: (
        moveData: IBusinessDomainItem,
        targetData: IBusinessDomainItem,
    ) => void
}

const Move: React.FC<IMove> = ({
    open,
    data,
    onClose,
    domainLevels,
    onOk,
    isBusinessArea = false,
}) => {
    const [pId, setPId] = useState('')
    const [treeData, setTreeData] = useState<IBusinessDomainItem[]>([])
    const getDisabledNode = (node: IBusinessDomainItem) => {
        if (data.type === BusinessDomainLevelTypes.Domain) {
            // 目标节点是流程节点
            // 当前节点下一层在模板中如果是流程，则不可选择
            // 目标节点是自己
            if (
                node.type === BusinessDomainLevelTypes.Process ||
                domainLevels[node.path.split('/').length - 1] !== node.type ||
                domainLevels[node.path.split('/').length] ===
                    BusinessDomainLevelTypes.Process ||
                node.id === data.id ||
                node.type !== BusinessDomainLevelTypes.DomainGrouping
            ) {
                return {
                    disable: true,
                    message: __('不支持选择此节点'),
                }
            }
        }

        if (data.type === BusinessDomainLevelTypes.Process) {
            if (
                node.type === BusinessDomainLevelTypes.DomainGrouping ||
                domainLevels[node.path.split('/').length - 1] !== node.type ||
                domainLevels[node.path.split('/').length] !==
                    BusinessDomainLevelTypes.Process
            ) {
                return {
                    disable: true,
                    message: __('不支持选择此节点'),
                }
            }
        }

        return {
            disable: false,
            message: '',
        }
    }
    const handleOk = async () => {
        if (!pId) return
        try {
            await moveBusinessDomainTreeNode(pId, data.id)
            const hasAuditProcess = await checkAuditProcess(data.type)
            // 未配置发布审核流程时提示移动成功
            if (!hasAuditProcess) {
                message.success(__('移动成功'))
            }

            onOk?.(data, getNode(treeData, pId))
            onClose()
        } catch (error) {
            formatError(error)
        }
    }

    // 暂时不支持选择目标位置，先注释保留
    // const handleExchangeOrder = (index: number) => {
    //     const left = dataArr.slice(0, index)
    //     const right = dataArr.slice(index)
    //     const newData = [
    //         ...left.filter((item) => item.id !== 1),
    //         { id: 1, name: '业务域的名称1' },
    //         ...right.filter((item) => item.id !== 1),
    //     ]
    //     setDataArr(newData)
    // }

    // const getPositionComp = (index: number) => {
    //     return (
    //         <div
    //             className={styles['line-container']}
    //             onClick={() => handleExchangeOrder(index)}
    //         >
    //             <div className={styles.arrow} />
    //             <div className={styles.line} />
    //         </div>
    //     )
    // }

    const getTreeData = (td: IBusinessDomainItem[]) => {}
    return (
        <Modal
            title={__('移动')}
            width={640}
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            bodyStyle={{ padding: '24px 12px 78px' }}
            destroyOnClose
        >
            <div className={styles['move-wrapper']}>
                {/* <div className={styles.title}>{__('配置父级节点')}</div> */}
                <div className={styles.label}>{__('父级节点')}</div>
                <BusinessDomainSelect
                    placeholder={__('请选择父级节点')}
                    getDisabledNode={getDisabledNode}
                    onChange={(val: string | string[]) => {
                        setPId(val as string)
                    }}
                    getTreeData={setTreeData}
                    isShowProcess={!isBusinessArea}
                />
                {/* <div className={styles.title}>{__('为此节点选择目标位置')}</div>
                <div>
                    {dataArr.map((item, index) => {
                        return (
                            <React.Fragment key={item.id}>
                                {getPositionComp(index)}
                                <div
                                    className={classnames(
                                        styles.item,
                                        item.id === 1 && styles['item-bg'],
                                    )}
                                >
                                    {item.name}
                                </div>
                                {index === tempData.length - 1 &&
                                    getPositionComp(index + 1)}
                            </React.Fragment>
                        )
                    })}
                </div> */}
            </div>
        </Modal>
    )
}
export default Move
