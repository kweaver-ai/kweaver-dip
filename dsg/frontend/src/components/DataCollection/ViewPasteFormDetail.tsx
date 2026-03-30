import * as React from 'react'
import { useState, useEffect } from 'react'
import { Drawer, Form } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import AutoFormView from '../AutoFormView'
import { DisplayInfoComponentType } from '../AutoFormView/helper'

interface ViewPasteFormDetailType {
    formInfo: any
    onClose: () => void
}

const ViewPasteFormDetail = ({
    onClose,
    formInfo,
}: ViewPasteFormDetailType) => {
    const [form] = Form.useForm()
    const [formConfig, setFormConfig] = useState<any>(null)

    useEffect(() => {
        initFormConfig()
    }, [formInfo])
    /**
     * 初始化配置
     */

    const initFormConfig = () => {
        setFormConfig({
            name: {
                type: DisplayInfoComponentType.Text,
                label: __('数据表名称'),
            },
            description: {
                type: DisplayInfoComponentType.AreaText,
                label: __('描述'),
            },
        })
    }
    return (
        <Drawer
            width={400}
            title={
                <div className={styles.editFieldTitle}>
                    <div className={styles.editTitle}>{__('数据表信息')}</div>
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
            mask={false}
            open
            getContainer={false}
            style={{ position: 'absolute' }}
            className={styles.nodeConfigWrapper}
            footer={null}
            destroyOnClose
        >
            {formConfig && <AutoFormView data={formInfo} config={formConfig} />}
        </Drawer>
    )
}

export default ViewPasteFormDetail
