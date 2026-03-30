import React, { useEffect, useMemo, useState } from 'react'
import { Button, Spin, Tooltip } from 'antd'
import classnames from 'classnames'
import { CheckCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { AutoCompleteStatus, stateType } from '../const'
import qaColored from '@/assets/qaColored.png'
import styles from './styles.module.less'
import __ from '../locale'
import { useDataViewContext } from '../DataViewProvider'
import { useTestLLM } from '@/hooks/useTestLLM'
import qa from '@/assets/qa.png'

/**
 * 自动补全状态图标
 */
export const AutoCompletionIcon = ({
    viewModal,
    onClick,
}: {
    viewModal: string
    onClick?: () => void
}) => {
    const { completeStatus, optionType, baseInfoData } = useDataViewContext()
    const [llm] = useTestLLM()

    const tips = useMemo(() => {
        let tip: any = ''
        if (!llm) {
            return __('认知助手服务不可用')
        }
        if (baseInfoData?.status === stateType.delete) {
            return __('源表已删除，无法生成')
        }
        switch (completeStatus) {
            case AutoCompleteStatus.None:
            case AutoCompleteStatus.UsedAll:
                tip =
                    optionType === 'edit'
                        ? __('业务名称自动补全')
                        : __('生成业务名称')
                break
            case AutoCompleteStatus.Completing:
                tip = __('业务名称自动补全中')
                break
            case AutoCompleteStatus.Completed:
                tip = __('补全完成确认结果')
                break
            case AutoCompleteStatus.Failed:
                tip = (
                    <>
                        {__('系统自动补全失败，')}
                        <a
                            style={{ color: '#3A8FF0' }}
                            onClick={() => onClick?.()}
                        >
                            {__('重新发起')}
                        </a>
                    </>
                )
                break
            default:
                break
        }
        return tip
    }, [completeStatus, llm])

    const disabled = useMemo(() => {
        return (
            [AutoCompleteStatus.Completing, AutoCompleteStatus.Failed].includes(
                completeStatus,
            ) ||
            baseInfoData?.status === stateType.delete ||
            !llm
        )
    }, [completeStatus, baseInfoData?.status, llm])

    return viewModal === 'table' ? (
        <Tooltip title={tips}>
            <div
                className={classnames(
                    styles.autoCompletionIcon,
                    disabled && styles.disalbed,
                )}
                onClick={() => !disabled && onClick?.()}
            >
                {completeStatus === AutoCompleteStatus.Completing && (
                    <Spin size="small" className={styles.spin} />
                )}
                {completeStatus !== AutoCompleteStatus.Completing && (
                    <img
                        src={llm ? qaColored : qa}
                        draggable={false}
                        alt=""
                        width="16px"
                    />
                )}
                {completeStatus === AutoCompleteStatus.Completed && (
                    <CheckCircleFilled
                        className={classnames(styles.icon, styles.checkIcon)}
                    />
                )}
                {completeStatus === AutoCompleteStatus.Failed && (
                    <InfoCircleFilled
                        className={classnames(styles.icon, styles.failedIcon)}
                    />
                )}
            </div>
        </Tooltip>
    ) : (
        <Tooltip title={tips}>
            <div className={styles.autoCompletionIconList}>
                <Button
                    style={{ display: 'flex' }}
                    icon={
                        <img
                            src={llm ? qaColored : qa}
                            draggable={false}
                            alt=""
                            width="16px"
                            style={{ marginRight: 8 }}
                        />
                    }
                    disabled={disabled}
                    onClick={() => !disabled && onClick?.()}
                >
                    {__('业务名称补全')}
                </Button>
            </div>
        </Tooltip>
    )
}
