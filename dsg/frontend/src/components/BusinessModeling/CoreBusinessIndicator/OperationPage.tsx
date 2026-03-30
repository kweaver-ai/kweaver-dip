import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { LeftOutlined } from '@ant-design/icons'
import { Button, Divider, Space } from 'antd'
import styles from './styles.module.less'
import CommonForm from './CommonForm'
import {
    IBusinessIndicator,
    formatError,
    getCoreBusinessIndicatorDetail,
} from '@/core'
import { OperateType, getActualUrl } from '@/utils'
import __ from '../locale'
import { IndicatorTaskColored } from '@/icons'
/**
 * 新建/编辑业务指标（跳转页）
 * @returns
 */
function OperationPage() {
    const { id: modelId } = useParams()
    const [searchParams] = useSearchParams()
    const redirect = searchParams.get('redirect') || ''
    const indicatorId = searchParams.get('id') || ''
    const indicatorOpt = searchParams.get('optType') || ''

    const formRef = useRef<any>()
    const [operateItem, setOperateItem] = useState<IBusinessIndicator>()
    const [operateType, setOperateType] = useState<OperateType | undefined>(
        OperateType.CREATE,
    )
    const [loading, setLoading] = useState<boolean>(false)
    useEffect(() => {
        if (indicatorOpt) {
            switchMode(indicatorId, indicatorOpt)
        }
    }, [indicatorId, indicatorOpt])

    // 切换当前指标状态
    const switchMode = async (id: string | undefined, optType: string) => {
        // 创建业务指标
        if (!id) {
            setOperateItem(undefined)
            setOperateType(optType as OperateType)
            return
        }

        try {
            const ret: IBusinessIndicator =
                await getCoreBusinessIndicatorDetail(id)
            setOperateItem(ret)
            setOperateType(optType as OperateType)
            formRef.current?.setValues()
        } catch (error) {
            formatError(error)
        }
    }

    const handleClose = () => {
        const backUrl = redirect || '/'
        window.location.replace(getActualUrl(`${decodeURIComponent(backUrl)}`))
    }

    const title = useMemo(
        () =>
            operateType === OperateType.CREATE
                ? __('新建业务指标')
                : __('编辑业务指标'),
        [operateType],
    )

    const handleOk = async () => {
        setLoading(true)
        const isSuccess = await formRef.current?.handleSubmit()
        setLoading(false)

        if (isSuccess) {
            handleClose()
        }
    }

    return (
        <div className={styles['opt-wrapper']}>
            <div className={styles['opt-wrapper-top']}>
                <div onClick={handleClose} className={styles['top-return']}>
                    <LeftOutlined className={styles['top-return-icon']} />
                    <span className={styles['top-return-txt']}>
                        {__('返回')}
                    </span>
                </div>
                <Divider className={styles['top-divider']} type="vertical" />

                <div className={styles['top-title']}>
                    <IndicatorTaskColored
                        className={styles['top-title-icon']}
                    />
                    <div className={styles['top-title-txt']}>{title}</div>
                </div>
            </div>
            <div className={styles['opt-wrapper-content']}>
                <div className={styles['opt-wrapper-content-center']}>
                    <div className={styles.form}>
                        <CommonForm
                            ref={formRef}
                            mId={modelId}
                            item={operateItem}
                            operate={operateType as OperateType}
                        />
                    </div>

                    <div className={styles.footer}>
                        <div className={styles.operate}>
                            <Space>
                                <Button
                                    className={styles.cancelBtn}
                                    onClick={handleClose}
                                >
                                    取消
                                </Button>
                                <Button
                                    className={styles.okBtn}
                                    type="primary"
                                    htmlType="submit"
                                    onClick={handleOk}
                                    disabled={loading}
                                >
                                    确定
                                </Button>
                            </Space>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OperationPage
