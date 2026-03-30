import React, { useEffect, useState, useRef } from 'react'
import { Modal, Space, Button, Tooltip } from 'antd'
import { noop } from 'lodash'

import { formatError, ISubjectDomainItem } from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import emptyData from '@/assets/dataEmpty.svg'
import { CloseOutlined, BusinessProcessColored } from '@/icons'
import BusinessDomainTree from '@/components/BusiArchitecture/BusinessDomainTree'

interface ISelectBusinFlow {
    open: boolean
    onClose: (isSearch?: boolean, isFlag?: string) => void
    onOK?: (val: any) => void
    id?: string
    selValue?: Array<any>
}
const SelectBusinFlow: React.FC<ISelectBusinFlow> = ({
    open,
    onClose = noop,
    onOK = noop,
    id,
    selValue = [],
}) => {
    const [selectedNodeList, setSelectedNodeList] = useState<any[]>(selValue)
    const [btnLoading, setBtnLoading] = useState<boolean>(false)

    useEffect(() => {
        if (selValue?.length) {
            setSelectedNodeList(selValue)
        }
    }, [selValue])

    const getItems = (objs: ISubjectDomainItem[]) => {
        return objs.map((so) => {
            const { path } = so
            const title = __('业务领域：')
            return (
                <div className={styles.seletedItem} key={so.id}>
                    <div className={styles.leftInfo}>
                        <BusinessProcessColored className={styles.typeIcon} />
                        <div className={styles.infos}>
                            <div title={so.name} className={styles.name}>
                                {so.name}
                            </div>
                            <div title={path} className={styles.path}>
                                {title}
                                {path}
                            </div>
                        </div>
                    </div>
                    <CloseOutlined
                        className={styles.closeIcon}
                        onClick={() => delselectedFlow(so.id)}
                    />
                </div>
            )
        })
    }

    const getModalFooter = () => {
        return (
            <Space size={16}>
                <Button onClick={() => onClose()}>{__('取消')}</Button>
                <Button type="primary" onClick={() => onOK(selectedNodeList)}>
                    {__('确定')}
                </Button>
            </Space>
        )
    }

    const delselectedFlow = (selectedId: string) => {
        const list = selectedNodeList.filter((item) => item.id !== selectedId)

        setSelectedNodeList(list)
    }

    return (
        <Modal
            title={__('选择主干业务')}
            width={800}
            open={open}
            onCancel={() => onClose(true)}
            bodyStyle={{ height: 462 }}
            destroyOnClose
            maskClosable={false}
            className={styles.selectModalWrapper}
            footer={<div className={styles.footer}>{getModalFooter()}</div>}
        >
            <div className={styles.selectBusinFlowWrapper}>
                <div className={styles.content}>
                    <div className={styles.left}>
                        <div className={styles.objTreeWrapper}>
                            <BusinessDomainTree
                                getSelectedKeys={(node: any) => {
                                    setSelectedNodeList(node)
                                }}
                                placeholder={__('搜索主干业务')}
                                placeholderWith={125}
                                isIncludeProcess
                                isShowAll={false}
                                isOnlySelectProcess
                                isInitCheck={false}
                                selectedNode={selectedNodeList}
                                isMultiple
                                filterType={['process']}
                            />
                        </div>
                    </div>
                    <div className={styles.right}>
                        <div className={styles.top}>
                            <span className={styles.count}>
                                {__('已选择：')} {selectedNodeList.length}
                                {__('个')}
                            </span>
                            <Button
                                type="link"
                                disabled={selectedNodeList.length === 0}
                                className={styles.clear}
                                onClick={() => setSelectedNodeList([])}
                            >
                                {__('全部移除')}
                            </Button>
                        </div>
                        <div className={styles.bottom}>
                            {selectedNodeList.length === 0 ? (
                                <Empty
                                    iconSrc={emptyData}
                                    desc={__('暂无数据')}
                                />
                            ) : (
                                getItems(selectedNodeList)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
export default SelectBusinFlow
