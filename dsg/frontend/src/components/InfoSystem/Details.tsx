import { Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { formatError, ISystemItem } from '@/core'
import CustomDrawer from '../CustomDrawer'
import __ from './locale'
import styles from './styles.module.less'
import { detailsList } from './helper'
import { formatTime } from '@/utils'

interface IDataCatlgContent {
    open: boolean
    onClose: () => void
    details: ISystemItem
}

const Details: React.FC<IDataCatlgContent> = ({ open, onClose, details }) => {
    return (
        <div className={styles.detailsWrapper}>
            <Modal
                open={open}
                title={__('信息系统详情')}
                width={640}
                className={styles.detailsModal}
                onCancel={onClose}
                maskClosable={false}
                footer={null}
                destroyOnClose
                getContainer={false}
            >
                <div className={styles.detailsTitle}>{details?.name}</div>
                <div className={styles.detailsContent}>
                    {detailsList.map((item) => {
                        const keyContent =
                            item.key === 'acceptance_at' &&
                            details.acceptance_at
                                ? formatTime(
                                      details.acceptance_at,
                                      'YYYY-MM-DD',
                                  )
                                : item.key === 'status'
                                ? [
                                      {
                                          value: 1,
                                          label: __('已建'),
                                      },
                                      {
                                          value: 2,
                                          label: __('拟建'),
                                      },
                                      {
                                          value: 3,
                                          label: __('在建'),
                                      },
                                  ].find((it) => it.value === details?.status)
                                      ?.label || '--'
                                : details?.[item.key] || ''
                        const secKeyContent = item.secKey
                            ? details?.[item.secKey]
                            : ''
                        const showContent = `${keyContent}${
                            secKeyContent
                                ? ` ${__('更新于')} ${moment(
                                      secKeyContent,
                                  ).format('YYYY-MM-DD HH:mm:ss')}`
                                : ''
                        }`

                        return (
                            <div className={styles.detailRow} key={item.key}>
                                <div className={styles.detailLabel}>
                                    {item.label}
                                </div>
                                <div
                                    className={styles.detailText}
                                    title={showContent}
                                >
                                    {showContent || '--'}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Modal>
        </div>
    )
}

export default Details
