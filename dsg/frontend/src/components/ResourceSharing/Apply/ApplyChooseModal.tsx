import React, { useState, useEffect, useMemo } from 'react'
import { Modal, ModalProps } from 'antd'
import classnames from 'classnames'
import { CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import __ from '../locale'
import styles from './styles.module.less'
import { ApplyResource } from '../const'
import ResourceIcon from './ResourceIcon'
import SharingDrawer from '../SharingDrawer'

interface IApplyChooseModal extends ModalProps {
    data?: any // 目录信息
    open: boolean
    onOk: () => void
}

/**
 * 申请选择资源
 */
const ApplyChooseModal = ({
    data,
    open,
    onOk,
    ...props
}: IApplyChooseModal) => {
    const navigate = useNavigate()
    const [visible, setVisible] = useState(false)
    // 选中的资源
    const [selectedItem, setSelectedItem] = useState<any>()
    // 申请资源显示
    const [applyResourceOpen, setApplyResourceOpen] = useState<any>()
    // 资源信息
    const [applyResource, setApplyResource] = useState<any>()

    // 资源列表
    const resData = useMemo(() => {
        if (data) {
            // 数据增加资源类型
            let res: any[] = []
            Object.keys(data.resource_groups || '').forEach((key) => {
                const items = data.resource_groups[key]
                if (items && items.length > 0) {
                    switch (key) {
                        case ApplyResource.Database:
                            res = [
                                ...res,
                                ...items.map((item) => ({
                                    ...item,
                                    type: ApplyResource.Database,
                                })),
                            ]
                            break
                        case ApplyResource.Interface:
                            res = [
                                ...res,
                                ...items.map((item) => ({
                                    ...item,
                                    type: ApplyResource.Interface,
                                })),
                            ]
                            break
                        case ApplyResource.File:
                            res = [
                                ...res,
                                ...items.map((item) => ({
                                    ...item,
                                    type: ApplyResource.File,
                                })),
                            ]
                            break
                        default:
                            break
                    }
                }
            })
            return res
        }
        return []
    }, [data])

    // 跳转到申请
    const jumpUrl = (res: any) => {
        setVisible(false)
        const resource = {
            catalog_id: data.id,
            catalog_title: data.title,
            resource_id: res.resource_id,
            resource_name: res.resource_name,
            resource_type: res.type,
        }
        setApplyResource(btoa(encodeURIComponent(JSON.stringify(resource))))
        setApplyResourceOpen(true)
        // navigate(
        //     `/dataService/resourceSharing/applyDrawer?operate=create&resource=${btoa(
        //         encodeURIComponent(JSON.stringify(resource)),
        //     )}&backurl=${btoa(encodeURIComponent('/data-assets'))}`,
        // )
    }

    useEffect(() => {
        if (open && resData.length > 0) {
            if (resData.length === 1) {
                jumpUrl(resData[0])
                return
            }
            setVisible(true)
            setSelectedItem(
                resData.find((item) => item.type === ApplyResource.Database) ||
                    resData[0],
            )
        } else {
            setVisible(false)
        }
    }, [open, resData])

    const handleOk = () => {
        jumpUrl(selectedItem)
    }

    return (
        <>
            <Modal
                width={400}
                open={visible}
                title={__('选择要申请的资源')}
                maskClosable={false}
                destroyOnClose
                getContainer={false}
                okText={__('确定')}
                cancelText={__('取消')}
                okButtonProps={{ style: { minWidth: 80 } }}
                cancelButtonProps={{ style: { minWidth: 80 } }}
                bodyStyle={{
                    maxHeight: 484,
                    padding: 0,
                    margin: 24,
                    overflow: 'hidden auto',
                }}
                onOk={() => handleOk()}
                {...props}
            >
                <div className={styles.applyChooseModal}>
                    {resData.map((item, idx) => {
                        const selected =
                            item.resource_id === selectedItem?.resource_id
                        return (
                            <div
                                key={idx}
                                className={classnames(
                                    styles.res_item,
                                    selected && styles.res_item_selected,
                                )}
                                onClick={() => setSelectedItem(item)}
                            >
                                <ResourceIcon type={item.type} />
                                <div className={styles.info}>
                                    <div
                                        className={styles.name}
                                        title={item.resource_name}
                                    >
                                        {item.resource_name}
                                    </div>
                                    {item.resource_code && (
                                        <div
                                            className={styles.code}
                                            title={item.resource_code}
                                        >
                                            {item.resource_code}
                                        </div>
                                    )}
                                </div>
                                {selected && (
                                    <CheckOutlined
                                        style={{ color: '#65B1FC' }}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            </Modal>
            <SharingDrawer
                open={applyResourceOpen}
                operate="create"
                applyResource={applyResource}
                onClose={() => {
                    onOk()
                }}
            />
        </>
    )
}

export default ApplyChooseModal
