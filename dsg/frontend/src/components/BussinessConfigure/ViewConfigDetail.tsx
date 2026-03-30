import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer, Form } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import ConfigDrawer from './ConfigDrawer'
import { OptionModel } from '../MetricModel/const'

interface ViewPasteFormDetailType {
    onClose: () => void
    modelId: string // 模型id
    indicatorId: string | undefined // 指标id
    mode: OptionModel
    graphData: any
    dataTypeOptions: any
}

// 查看指标详情
const ViewConfigDetail = ({
    onClose,
    modelId,
    indicatorId,
    mode,
    graphData,
    dataTypeOptions,
}: ViewPasteFormDetailType) => {
    const [open, setOpen] = useState(false)

    const getWidth = () => {
        return window.innerWidth * (800 / 1920)
    }

    return (
        <Drawer
            width={getWidth()}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>业务指标详情</div>
                    <div className={styles.closeButton}>
                        <CloseOutlined
                            onClick={() => {
                                onClose()
                            }}
                        />
                    </div>
                </div>
            }
            placement="right"
            closable={false}
            onClose={() => {
                onClose()
            }}
            open
            mask={false}
            maskClosable
            getContainer={false}
            style={{ position: 'absolute' }}
            className={styles.nodeConfigWrapper}
            footer={null}
            destroyOnClose
            bodyStyle={{ paddingTop: 16 }}
        >
            {modelId && indicatorId && (
                <ConfigDrawer
                    modelId={modelId}
                    indicatorId={indicatorId}
                    graphData={graphData}
                    dataTypeOptions={dataTypeOptions}
                />
            )}
        </Drawer>
    )
}

export default ViewConfigDetail
