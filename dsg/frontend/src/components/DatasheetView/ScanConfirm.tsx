import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { Modal, Button, message, notification } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
// import scanGif from '@/assets/scan.gif'

interface IScanConfirm {
    open: boolean
    onClose: () => void
    curSum: number
    datasourceData: any[]
}

const ScanConfirm: React.FC<IScanConfirm> = ({
    open,
    curSum,
    onClose,
    datasourceData,
}) => {
    const handleOk = () => {
        onClose()
    }

    const totalSum = useMemo(() => {
        return datasourceData.length
    }, [datasourceData])

    return (
        <div>
            <Modal
                title={__('扫描数据源')}
                width={600}
                open={open}
                onCancel={onClose}
                className={classnames(
                    styles.confirmWrapper,
                    totalSum < 2 && styles.noCloseBtn,
                )}
                maskClosable={false}
                footer={
                    totalSum > 1
                        ? [
                              <Button key="back" onClick={handleOk}>
                                  {__('终止扫描')}
                              </Button>,
                          ]
                        : null
                }
            >
                <div className={styles.confirmBox}>
                    <div>
                        {/* <img
                                src={scanGif}
                                alt=""
                                className={styles.confirmLeftImg}
                            /> */}
                    </div>
                    {totalSum > 1 ? (
                        <div>
                            <div>{`${__('正在扫描第')}${curSum}${__(
                                '个数据源（共',
                            )}${totalSum}${__('个）')}`}</div>

                            <div className={styles.subTitle}>
                                {`${__('已完成')}${Math.floor(
                                    ((curSum > 0 ? curSum - 1 : curSum) /
                                        totalSum) *
                                        100,
                                )}%`}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {__('正在扫描1个数据源：')}
                            <span style={{ wordBreak: 'break-all' }}>
                                {datasourceData[0]?.name}
                            </span>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    )
}

export default ScanConfirm
