import { Modal, Tooltip } from 'antd'
import React from 'react'

import { CheckCircleFilled } from '@ant-design/icons'
import { info } from '@/utils/modalHelper'
import { OperateType, stateLableType } from './const'
import __ from './locale'
import styles from './styles.module.less'

// 类目状态
export const StateLabel: React.FC<{
    state: stateLableType
    tips?: string
    label?: string
}> = ({ state, tips, label }) => {
    const stateNode = () => {
        switch (state) {
            case stateLableType.enabled:
                return (
                    <div className={styles.categoryStateLabel}>
                        {__('已启用')}
                    </div>
                )
            case stateLableType.unenable:
                return (
                    <div
                        className={styles.categoryStateLabel}
                        style={{
                            color: '#FF4D4F',
                            background: 'rgba(255,77,79,0.07)',
                        }}
                    >
                        {label || __('已停用')}
                    </div>
                )
            case stateLableType.draft:
                return (
                    <div
                        className={styles.categoryStateLabel}
                        style={{
                            color: '#4C5B76',
                            background: '#fff',
                            fontSize: '12px',
                            border: '1px solid rgba(76,91,118,0.6)',
                        }}
                    >
                        {__('草稿')}
                    </div>
                )
            case stateLableType.hasDraft:
                return (
                    <div
                        className={styles.categoryStateLabel}
                        style={{
                            color: '#4C5B76',
                            background: '#fff',
                            fontSize: '12px',
                            border: '1px solid rgba(76,91,118,0.6)',
                        }}
                    >
                        {__('有草稿')}
                    </div>
                )
            default:
                return <div />
        }
    }
    return (
        <Tooltip placement="bottom" title={tips}>
            {stateNode()}
        </Tooltip>
    )
}

export interface ILabelTitle {
    label: string
    id?: string
    isRequired?: boolean
    suffix?: any
}
export const LabelTitle: React.FC<ILabelTitle> = ({
    label,
    id,
    suffix,
    isRequired,
}) => {
    return (
        <div className={styles.labelTitleWrapper} id={id}>
            <span
                className={styles.labelLine}
                style={isRequired ? { marginRight: '2px' } : undefined}
            />
            {isRequired ? (
                <span className={styles.labelTitleRequired}>*</span>
            ) : null}
            <span>{label}</span>
            <span className={styles.labelTitleRight}>{suffix}</span>
        </div>
    )
}

export const submitTips = (type: OperateType | string, callBack: any) => {
    const title =
        type === 'create'
            ? __('新建')
            : type === 'edit'
            ? __('变更')
            : __('删除')
    info({
        title: title + __('标签类型需要进行审核，您的申请已提交给审核员。'),
        icon: <CheckCircleFilled style={{ color: '#52C41B' }} />,
        content: (
            <div className={styles.confirmModal}>
                {__('可前往')}
                <span
                    onClick={() => {
                        callBack()
                        Modal.destroyAll()
                    }}
                    className={styles.confirmModalBtn}
                >
                    {__('【我的申请】')}
                </span>
                {__('查看审核进度。')}
            </div>
        ),
        okText: __('关闭'),
    })
}
