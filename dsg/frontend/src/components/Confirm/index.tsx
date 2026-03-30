import React, { useState } from 'react'
import {
    render as reactRender,
    unmount as reactUnmount,
} from 'rc-util/lib/React/render'
import { Modal, Button, Space, ModalProps, ConfigProvider } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { noop } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'

interface IConfirm extends ModalProps {
    content: React.ReactNode
    onSure?: (e) => void
    onClose?: (e) => void
    icon?: React.ReactNode
    cancelDisabled?: boolean
    confirmDisabled?: boolean
}

const Confirm: React.FC<IConfirm> = ({
    onOk = () => {},
    onCancel = () => {},
    title,
    content,
    width = 416,
    okText = __('确定'),
    cancelText = __('取消'),
    okButtonProps,
    icon = <ExclamationCircleFilled className={styles.icon} />,
    ...rest
}) => {
    return (
        <div className={styles.container}>
            <Modal width={width} footer={null} {...rest} getContainer={false}>
                <div className={styles.title}>
                    {icon}
                    <div className={styles.text}>{title}</div>
                </div>
                <div className={styles.content}>{content}</div>
                <div className={styles.operate}>
                    <Space size={12}>
                        <Button className={styles.btn} onClick={onCancel}>
                            {cancelText}
                        </Button>
                        <Button
                            className={styles.btn}
                            type="primary"
                            onClick={onOk}
                            {...okButtonProps}
                        >
                            {okText}
                        </Button>
                    </Space>
                </div>
            </Modal>
        </div>
    )
}

export const Confirm2: React.FC<IConfirm> = ({
    onSure = (e) => {},
    onClose = (e) => {},
    title,
    content,
    okText = __('确定'),
    cancelText = __('取消'),
    okButtonProps,
    cancelDisabled = false,
    confirmDisabled = false,
    icon = <ExclamationCircleFilled />,
    ...modalProps
}) => {
    return (
        <Modal
            title={null}
            width={432}
            footer={
                <div className={styles.cf2_footer}>
                    <Button disabled={cancelDisabled} onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button
                        disabled={confirmDisabled}
                        type="primary"
                        onClick={onSure}
                    >
                        {okText}
                    </Button>
                </div>
            }
            className={styles.confirm2Wrap}
            bodyStyle={{ padding: 32 }}
            {...modalProps}
            getContainer={false}
        >
            <div className={styles.cf2}>
                <div className={styles.cf2_icon}>{icon}</div>
                <div className={styles.cf2_contentWrap}>
                    <div className={styles.cf2_title}>{title}</div>
                    <div className={styles.cf2_info}>{content}</div>
                </div>
            </div>
        </Modal>
    )
}

export const ConfirmFunctional = ({
    onSure = () => {},
    onClose = () => {},
    title,
    content,
    okText = __('确定'),
    cancelText = __('取消'),
    okButtonProps,
    onCancel = noop,
    cancelDisabled = false,
    confirmDisabled = false,
    maskClosable = false,
    icon = (
        <ExclamationCircleFilled style={{ color: 'rgba(245, 34, 45, 1)' }} />
    ),
    ...modalProps
}: IConfirm) => {
    const currrentContainer = document.createDocumentFragment()

    reactRender(
        <ConfigProvider
            prefixCls="any-fabric-ant"
            iconPrefixCls="any-fabric-anticon"
        >
            <Confirm2
                open
                onSure={(e) => {
                    onSure(e)
                    reactUnmount(currrentContainer)
                }}
                onClose={(e) => {
                    onCancel(e)
                    reactUnmount(currrentContainer)
                }}
                onCancel={(e) => {
                    onClose(e)
                    reactUnmount(currrentContainer)
                }}
                title={title}
                content={content}
                okText={okText}
                cancelText={cancelText}
                okButtonProps={okButtonProps}
                cancelDisabled={cancelDisabled}
                confirmDisabled={confirmDisabled}
                maskClosable={maskClosable}
                {...modalProps}
            />
        </ConfigProvider>,
        currrentContainer,
    )
}

export default Confirm
