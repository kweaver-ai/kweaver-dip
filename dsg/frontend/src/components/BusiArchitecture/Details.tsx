import React, { useEffect, useState } from 'react'
import { Modal } from 'antd'
import classnames from 'classnames'
import { LevelTypeNameMap } from '../BusinessDomainLevel/const'
import __ from './locale'
import styles from './styles.module.less'
import {
    BusinessDomainLevelTypes,
    getBusinessDomainTreeNodeDetails,
    IBusinessDomainItem,
    LoginPlatform,
} from '@/core'
import { formatTime, getPlatformNumber } from '@/utils'

interface IDetails {
    open: boolean
    isAudit?: boolean
    data: IBusinessDomainItem
    onClose: () => void
}
const Details: React.FC<IDetails> = ({ open, onClose, data, isAudit }) => {
    const [details, setDetails] = useState<IBusinessDomainItem>(data)
    const platformNumber = getPlatformNumber()

    const getData = async () => {
        const node: any = await getBusinessDomainTreeNodeDetails(
            data.id,
            isAudit ? { draft: true } : undefined,
        )
        setDetails(node)
    }

    useEffect(() => {
        if (open) {
            getData()
        }
    }, [open])

    const getPath = () => {
        const path = details?.path?.trim()
        if (!path) {
            return '--'
        }
        const pathArr = path.split('/')
        return pathArr
            .filter((item, index) => index !== pathArr.length - 1)
            .join('/')
    }
    return (
        <Modal
            title={__('${title}详情', {
                title: LevelTypeNameMap[details.type],
            })}
            width={640}
            open={open}
            onCancel={onClose}
            bodyStyle={{ maxHeight: 505, overflowY: 'auto' }}
            footer={null}
        >
            <div className={styles['details-wrapper']}>
                <div className={styles.row}>
                    <div className={styles.label}>
                        {details.type ===
                        BusinessDomainLevelTypes.DomainGrouping
                            ? __('业务领域分组名称')
                            : details.type === BusinessDomainLevelTypes.Domain
                            ? __('业务领域名称')
                            : platformNumber === LoginPlatform.default
                            ? __('业务流程名称')
                            : __('主干业务名称')}
                    </div>
                    <div className={styles.value}>{details.name}</div>
                </div>
                {details.type === BusinessDomainLevelTypes.Process && (
                    <>
                        <div className={styles.row}>
                            <div className={styles.label}>
                                {__('所属业务领域')}
                            </div>
                            <div className={styles.value}>{getPath()}</div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.label}>{__('所属部门')}</div>
                            <div className={styles.value}>
                                {details.department_name || '--'}
                            </div>
                        </div>
                        <div className={classnames(styles.row, styles.rows)}>
                            <div className={styles.label}>
                                {__('关联信息系统')}
                            </div>
                            <div
                                className={classnames(
                                    styles.value,
                                    styles.values,
                                )}
                            >
                                {details.business_system_name?.length > 0
                                    ? details.business_system_name.map(
                                          (item) => (
                                              <div
                                                  className={styles.system}
                                                  key={item}
                                              >
                                                  {item}
                                              </div>
                                          ),
                                      )
                                    : '--'}
                            </div>
                        </div>
                        <div className={classnames(styles.row, styles.rows)}>
                            <div className={styles.label}>
                                {__('是否业务事项')}
                            </div>
                            <div
                                className={classnames(
                                    styles.value,
                                    styles.values,
                                )}
                            >
                                {details.business_matter === 1
                                    ? __('是')
                                    : __('否')}
                            </div>
                        </div>
                    </>
                )}

                <div className={styles.row}>
                    <div className={styles.label}>{__('描述')}</div>
                    <div className={styles.value}>
                        {details.description || '--'}
                    </div>
                </div>
                <div className={classnames(styles.row, styles.lastRow)}>
                    <div className={styles.label}>{__('更新人/时间')}</div>
                    <div className={styles.value}>
                        <div className={styles.name}>{details.updated_by}</div>
                        <div className={styles.name}>
                            {formatTime(details.updated_at)}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}
export default Details
