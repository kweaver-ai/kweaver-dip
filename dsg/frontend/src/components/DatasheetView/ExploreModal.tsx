import React, { useEffect, useState } from 'react'
import { Modal, Checkbox } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { DataColoredBaseIcon } from '@/core/dataSource'
import { datasourceExploreConfig, formatError } from '@/core'

interface IExploreModal {
    open: boolean
    onClose: (flag?: boolean) => void
    datasourceData: any
}

const ExploreModal: React.FC<IExploreModal> = ({
    open,
    onClose,
    datasourceData,
}) => {
    const [isUpdate, setIsUpdate] = useState<boolean>(true)

    const onOk = async () => {
        try {
            await datasourceExploreConfig({ datasource_id: datasourceData?.id })
            onClose(true)
        } catch (err) {
            formatError(err)
        }
    }

    return (
        <div>
            <Modal
                title={__('数据探查')}
                width={480}
                open={open}
                onCancel={() => onClose()}
                className={styles.ExploreModalWrapper}
                maskClosable={false}
                okText={__('发起探查')}
                onOk={onOk}
            >
                <div className={styles.modalBox}>
                    <div className={styles.title}>
                        <DataColoredBaseIcon
                            type={datasourceData?.type}
                            iconType="Colored"
                            className={styles.titleIcon}
                        />
                        <div
                            className={styles.titleText}
                            title={datasourceData?.name}
                        >
                            {datasourceData?.name}
                        </div>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.label}>{__('探查项：')}</div>
                        <div>
                            <Checkbox
                                checked={isUpdate}
                                // 当前版本不支持取消勾选
                                // onChange={(e) => {
                                //     const { checked } = e.target
                                //     setIsUpdate(checked)
                                // }}
                            >
                                {__('数据更新时间戳')}
                            </Checkbox>
                            <div className={styles.tips}>
                                {__(
                                    '探查结束后，将自动配置数据更新时间戳，可以在表字段详情中修改。',
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default ExploreModal
