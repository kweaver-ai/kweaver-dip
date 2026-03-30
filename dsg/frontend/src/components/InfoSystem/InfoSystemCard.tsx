import { Divider, Dropdown, message } from 'antd'
import React, { useState } from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import { formatError, ISystemItem, reqDelInfoSystem } from '@/core'
import { EllipsisOutlined, InfoSystemCardOutlined } from '@/icons'
import { OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import Details from './Details'
import __ from './locale'
import styles from './styles.module.less'

interface ICoreBusinessCard {
    item: any
    handleOperate: (type: OperateType, item?: ISystemItem) => void
    onDeleteSuccess: () => void
}
const InfoSystemCard: React.FC<ICoreBusinessCard> = ({
    item,
    handleOperate,
    onDeleteSuccess = () => {},
}) => {
    const [showOperate, setShowOperate] = useState(false)

    // 详情
    const [detailsOpen, setDetailsOpen] = useState<boolean>(false)

    const items = [
        {
            key: OperateType.DETAIL,
            label: __('详细信息'),
        },
        {
            key: OperateType.EDIT,
            label: __('编辑'),
        },
        {
            key: OperateType.DELETE,
            label: __('删除'),
        },
    ]

    // 删除数据源
    const delCoreBusiness = async () => {
        try {
            await reqDelInfoSystem(item.id)
            message.success(__('删除成功'))
            onDeleteSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    // 删除确认
    const deleteConfirm = () => {
        confirm({
            title: __('确认要删除信息系统吗？'),
            icon: <ExclamationCircleFilled />,
            content: __('删除后将无法找回，请谨慎操作！'),
            onOk() {
                delCoreBusiness()
            },
        })
    }

    const onClick = ({ key, domEvent }) => {
        domEvent.stopPropagation()
        if (key === OperateType.DETAIL) {
            setDetailsOpen(true)
        } else if (key === OperateType.DELETE) {
            deleteConfirm()
        } else if (key === OperateType.EDIT) {
            handleOperate(OperateType.EDIT, item)
        }
    }

    return (
        <>
            <div
                className={styles.infoSystemCard}
                onMouseEnter={() => setShowOperate(true)}
                onMouseLeave={() => setShowOperate(false)}
            >
                <div className={styles.topWrapper}>
                    <div className={styles.titleWrapper}>
                        <div className={styles.modelIconWrapper}>
                            <InfoSystemCardOutlined />
                        </div>
                        <div className={styles.infoSysTitle} title={item.name}>
                            {item.name}
                        </div>
                    </div>
                    {items.filter((i) => i !== null).length > 0 && (
                        <div
                            className={styles.dropdown}
                            hidden={!showOperate}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Dropdown
                                menu={{ items, onClick }}
                                placement="bottomLeft"
                                trigger={['click']}
                                className={styles.itemMore}
                                overlayStyle={{ width: 90 }}
                            >
                                <EllipsisOutlined
                                    className={styles.operateIcon}
                                />
                            </Dropdown>
                        </div>
                    )}
                </div>
                <div
                    className={styles.infoSysDesc}
                    title={item.description || __('[暂无描述]')}
                >
                    {item.description || __('[暂无描述]')}
                </div>
                <div className={styles.updateInfo}>
                    {/* {item.is_register_gateway
                        ? __('已注册到网关')
                        : __('未注册到网关')} */}
                    <Divider type="vertical" />
                    <div className={styles.updateBy} title={item.updated_user}>
                        {item.updated_user}
                    </div>
                    <div className={styles.updateAt}>
                        {`${__('更新于')} ${moment(item.updated_at).format(
                            'YYYY-MM-DD HH:mm:ss',
                        )}`}
                    </div>
                </div>
            </div>
            {detailsOpen && (
                <Details
                    open={detailsOpen}
                    onClose={() => {
                        setDetailsOpen(false)
                    }}
                    details={item}
                />
            )}
        </>
    )
}

export default InfoSystemCard
