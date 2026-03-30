import { Dropdown, message } from 'antd'
import React, { ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ExclamationCircleFilled } from '@ant-design/icons'
import moment from 'moment'
import { delDataSource, formatError } from '@/core'
import { databaseTypesEleData } from '@/core/dataSource'
import { DatabaseOutlined, EllipsisOutlined } from '@/icons'
import { OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import Details from './Details'
import { editDataSourceOptions } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface ICoreBusinessCard {
    item: any
    handleOperate: (type: OperateType, id?: string) => void
    onDeleteSuccess: () => void
}
const DataBusinessCard: React.FC<ICoreBusinessCard> = ({
    item,
    handleOperate,
    onDeleteSuccess = () => {},
}) => {
    const [showOperate, setShowOperate] = useState(false)
    const [ColoredIcon, setColoredIcon] = useState<ReactNode | null>(null)
    const navigator = useNavigate()

    useEffect(() => {
        if (item.type) {
            const { Colored } = databaseTypesEleData.dataBaseIcons[item.type]
            if (Colored) {
                setColoredIcon(
                    <Colored
                        className={styles.modelIcon}
                        style={{
                            fontSize: '52px',
                        }}
                    />,
                )
            }
        }
    }, [item])

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
            await delDataSource(item.id)
            message.success(__('删除成功'))
            onDeleteSuccess()
        } catch (error) {
            formatError(error)
        }
    }

    // 删除确认
    const deleteConfirm = () => {
        confirm({
            title: __('确认要删除数据源吗？'),
            icon: <ExclamationCircleFilled className={styles.delIcon} />,
            content: (
                <span style={{ color: '#FF4D4F' }}>
                    {__(
                        '删除后将无法找回数据源，若通过扫描该数据源产生了库表，其库表也会被同步删除，请谨慎操作！',
                    )}
                </span>
            ),
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
            handleOperate(OperateType.EDIT, item.id)
        }
        domEvent.preventDefault()
    }

    const sourceType =
        editDataSourceOptions.find((sItem) => item.source_type === sItem.value)
            ?.label || '--'

    const schema = item.schema || '--'

    return (
        <>
            <div
                className={styles.dataBusinessCard}
                onMouseEnter={() => setShowOperate(true)}
                onMouseLeave={() => setShowOperate(false)}
            >
                <div className={styles.topInfo}>
                    <div className={styles.modelIconWrapper}>{ColoredIcon}</div>
                    <div className={styles.cardContentWrapper}>
                        <div className={styles.cardTopWrapper}>
                            <div className={styles.cardTopLeftWrapper}>
                                <div className={styles.name} title={item.name}>
                                    {item.name}
                                </div>
                                <div className={styles.cardInfo}>
                                    <DatabaseOutlined
                                        className={styles.countIcon}
                                    />
                                    <span
                                        className={styles.schema}
                                        title={__('数据库：') + schema}
                                    >
                                        {schema}
                                    </span>
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
                        <div className={styles.sourceInfo}>
                            {__('来源：')}
                            <span title={sourceType}>{sourceType}</span>
                        </div>
                        <div className={styles.updateInfo}>
                            <div
                                className={styles.updateBy}
                                title={item.updated_by_uid}
                            >
                                {item.updated_by_uid}
                            </div>
                            <div className={styles.updateAt}>
                                {`${__('更新于')} ${moment(
                                    item.updated_at,
                                ).format('YYYY-MM-DD HH:mm:ss')}`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {detailsOpen && (
                <Details
                    open={detailsOpen}
                    onClose={() => {
                        setDetailsOpen(false)
                    }}
                    id={item.id}
                />
            )}
        </>
    )
}

export default DataBusinessCard
