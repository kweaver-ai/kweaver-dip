import { Button, Modal, Space } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import React, { useEffect, useMemo } from 'react'
import { IFormula } from '@/core'
import __ from '../locale'
import { formulaInfo } from '../const'
import styles from './styles.module.less'

interface IFormulaSaveModal {
    open: boolean
    formulaItem?: IFormula
    onContinue: () => void
    onSave: () => void
    onCancel: () => void
}

const FormulaSaveModal: React.FC<IFormulaSaveModal> = ({
    open,
    formulaItem,
    onContinue,
    onSave,
    onCancel,
}) => {
    return (
        <Modal
            open={open}
            title={null}
            closable={false}
            width={420}
            bodyStyle={{ padding: '32px 32px 24px' }}
            footer={null}
        >
            <div className={styles.formulaSaveModal}>
                <div className={styles['formulaSaveModal-header']}>
                    <ExclamationCircleFilled
                        className={styles['formulaSaveModal-icon']}
                        style={{ color: '#faad14' }}
                    />
                    <span className={styles['formulaSaveModal-title']}>
                        {__('当前“${name}”算子配置已更改', {
                            name: formulaInfo[formulaItem?.type || '']?.name,
                        })}
                    </span>
                </div>
                <div className={styles['formulaSaveModal-content']}>
                    <div>{__('是否要放弃当前更改的内容？')}</div>
                    <div>
                        {__('您可以选择确定更改、放弃更改或继续进行配置。')}
                    </div>
                </div>
                <Space className={styles['formulaSaveModal-footer']} size={8}>
                    <Button onClick={onContinue}>{__('继续配置')}</Button>
                    <Button onClick={onCancel}>{__('放弃更改')}</Button>
                    <Button type="primary" onClick={onSave}>
                        {__('确定更改')}
                    </Button>
                </Space>
            </div>
        </Modal>
    )
}

export default FormulaSaveModal
