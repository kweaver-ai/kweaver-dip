import React, { useState } from 'react'
import { Modal, Radio, Space, ModalProps } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import styles from './styles.module.less'
import { formTypeArr, RepeatOperate } from './const'
import __ from './locale'

interface IImportPrompt extends ModalProps {
    visible: boolean
    formType: number
    names: any
    onClose: (value: string) => void
}

/**
 * 导入异常提示
 * @param formType number 表单类型
 * @param names any 旧/新名称
 * @param onClose 关闭, value-操作类型
 */
const ImportPrompt: React.FC<IImportPrompt> = ({
    visible,
    formType,
    names,
    onClose,
    ...props
}) => {
    // 请求load
    const [loading, setLoading] = useState(false)

    // 选项值
    const [value, setValue] = useState(RepeatOperate.RETAIN)

    return (
        <Modal
            width={480}
            open={visible}
            maskClosable={false}
            onCancel={() => onClose(RepeatOperate.CANCEL)}
            onOk={() => {
                setLoading(true)
                onClose(value)
            }}
            bodyStyle={{ padding: 0 }}
            destroyOnClose
            getContainer={false}
            okButtonProps={{ loading }}
            {...props}
        >
            <div className={styles.tipWrapper}>
                <div className={styles.error}>
                    <ExclamationCircleFilled className={styles.errorIcon} />
                    <div className={styles.tipText}>
                        {`${formTypeArr[formType].value}`}
                        {__('已存在相同业务表名称')}
                    </div>
                </div>
            </div>
            <div className={styles.repeatBody}>
                <div className={styles.text} style={{ marginBottom: 16 }}>
                    {`您可以将当前业务表“${names.Key}”做如下处理`}
                    {__('：')}
                </div>
                <Radio.Group
                    onChange={(e) => setValue(e.target.value)}
                    value={value}
                >
                    <Space direction="vertical" size={12}>
                        <Radio
                            value={RepeatOperate.RETAIN}
                            className={styles.text}
                        >
                            {__('同时保留两个业务表，当前业务表名称重命名为')}
                            {`“${names.Message}”`}
                        </Radio>
                        <Radio
                            value={RepeatOperate.COVER}
                            className={styles.text}
                        >
                            {__('上传并替换，使用当前业务表覆盖同名业务表')}
                        </Radio>
                    </Space>
                </Radio.Group>
            </div>
        </Modal>
    )
}

export default ImportPrompt
