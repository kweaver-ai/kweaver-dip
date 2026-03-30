import { Space } from 'antd'
import { useEffect, useState } from 'react'
import { ISSZDCatalog } from '@/core'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import __ from '../locale'
import Tags from './Tags'
import Confirm from '@/components/Confirm'
import { ResourceType, ResourceTypeMap } from './const'

interface ICatalog {
    value?: ISSZDCatalog
    onChange?: (val: ISSZDCatalog) => void
    chooseResource: () => void
    removeResource: () => void
    isImplement?: boolean
    attachedResourceType?: ResourceType
}
const Catalog = ({
    value,
    onChange,
    chooseResource,
    removeResource,
    isImplement = false,
    attachedResourceType,
}: ICatalog) => {
    const [info, setInfo] = useState<ISSZDCatalog>()
    const [removeOpen, setRemoveOpen] = useState(false)

    useEffect(() => {
        if (value) {
            setInfo(value)
        }
    }, [value])

    return (
        <div className={styles['catalog-info-container']}>
            <div className={styles['top-info']}>
                <div className={styles['catalog-info']}>
                    <FontIcon
                        name="icon-shujumuluguanli1"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles['catalog-title']}>{info?.title}</div>
                </div>
                <Space size={25}>
                    <div
                        className={styles['catalog-btn']}
                        onClick={chooseResource}
                    >
                        <FontIcon
                            name="icon-jia"
                            className={styles['catalog-btn-icon']}
                        />
                        {__('重新选择资源')}
                    </div>
                    <div
                        className={styles['catalog-btn']}
                        onClick={() => setRemoveOpen(true)}
                    >
                        <FontIcon
                            name="icon-lajitong"
                            className={styles['catalog-btn-icon']}
                        />
                        {__('移除')}
                    </div>
                </Space>
            </div>
            {isImplement ? (
                <div className={styles['catalog-items']}>
                    <div className={styles['catalog-item']}>
                        <div className={styles.label}>{__('挂接资源：')}</div>
                        <div className={styles.content}>
                            {attachedResourceType &&
                                info?.resource_groups[attachedResourceType]?.[0]
                                    .resource_name}
                        </div>
                    </div>
                    <div className={styles['catalog-item']}>
                        <div className={styles.label}>{__('资源类型：')}</div>
                        <div className={styles.content}>
                            {attachedResourceType
                                ? ResourceTypeMap[attachedResourceType]
                                : ''}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles['catalog-item']}>
                    <div className={styles.label}>{__('责任部门：')}</div>
                    <div className={styles.content}>{info?.dept_name}</div>
                </div>
            )}
            {!isImplement && (
                <div className={styles['catalog-list']}>
                    <div className={styles.label}>{__('需求信息项：')}</div>
                    <div className={styles.content}>
                        <Tags
                            isShowAdd={false}
                            width={900}
                            value={info?.info_items.map(
                                (item) => item.column_name_cn,
                            )}
                            onChange={(val) => {
                                const newInfo = {
                                    ...info,
                                    info_items:
                                        info?.info_items.filter((item) =>
                                            val.includes(item.column_name_cn),
                                        ) || [],
                                }
                                onChange?.(newInfo as ISSZDCatalog)
                            }}
                        />
                    </div>
                </div>
            )}
            <Confirm
                open={removeOpen}
                title={__('是否移除${name}资源？', {
                    name: info?.title,
                })}
                content={__('移除后可重新加入，请确认。')}
                onOk={() => {
                    removeResource()
                    setRemoveOpen(false)
                }}
                onCancel={() => {
                    setRemoveOpen(false)
                }}
                width={432}
            />
        </div>
    )
}

export default Catalog
