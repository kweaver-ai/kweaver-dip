import { Modal } from 'antd'
import React, { useEffect, useState } from 'react'
import moment from 'moment'
import { formatError, getDataBaseDetails } from '@/core'
import __ from './locale'
import styles from './styles.module.less'
import { dataServiceLabelList, basicInfoDetailsList } from './helper'
import { DetailsLabel } from '@/ui'

interface IDataCatlgContent {
    open: boolean
    onClose: () => void
    id: string
}

const Details: React.FC<IDataCatlgContent> = ({ open, onClose, id }) => {
    const [detailsInfo, setDetailsInfo] = useState<any[]>(basicInfoDetailsList)

    useEffect(() => {
        getDetails(id)
    }, [open])

    const getDetails = async (dId: string) => {
        try {
            const res = await getDataBaseDetails(dId)
            const data = { ...res, password: '********' }
            // 密码固定显示
            const list = detailsInfo?.map((item) => {
                const itemList = item?.list.map((it: any) => {
                    const obj = { ...it, value: data[it.key] }
                    if (it.key === 'created_at' || it.key === 'updated_at') {
                        obj.value = data[it.key]
                            ? moment(data[it.key]).format('YYYY-MM-DD HH:mm:ss')
                            : '--'
                    }
                    if (it.key === 'source_type') {
                        obj.value = dataServiceLabelList[data[it.key]] || '--'
                    }
                    return obj
                })
                return {
                    ...item,
                    list: itemList?.filter((o) =>
                        data.type === 'excel' ? true : o.type !== 'excel',
                    ),
                }
            })
            setDetailsInfo(list)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <div className={styles.detailsWrapper}>
            <Modal
                open={open}
                title={__('数据源详情')}
                width={640}
                className={styles.detailsModal}
                onCancel={onClose}
                maskClosable={false}
                footer={null}
                destroyOnClose
                getContainer={false}
            >
                <div className={styles.detailsContent}>
                    {detailsInfo.map((item) => {
                        return (
                            <div key={item.key}>
                                <div className={styles.detailsLabelTitle}>
                                    {item.label}
                                </div>
                                <div style={{ marginBottom: '16px' }}>
                                    <DetailsLabel
                                        wordBreak
                                        labelWidth="100px"
                                        detailsList={item.list}
                                    />
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
