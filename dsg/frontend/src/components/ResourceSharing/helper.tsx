import { ModalFuncProps, Tooltip } from 'antd'
import React from 'react'

import { ExclamationCircleFilled } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, Loader } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import __ from './locale'
import styles from './styles.module.less'

/**
 * 列表状态 view
 */
export const StatusView: React.FC<{
    data?: { text: string; color: string }
    tip?: string
}> = ({ data, tip }) => {
    return (
        <div className={styles.statusView}>
            <div
                className={styles.dot}
                style={{ background: data?.color || 'transparent' }}
            />
            <span className={styles.text}>{data?.text || '--'}</span>
            {tip && (
                <Tooltip title={tip} getPopupContainer={(n) => n}>
                    <FontIcon
                        name="icon-shenheyijian"
                        type={IconType.COLOREDICON}
                        style={{ fontSize: 16 }}
                    />
                </Tooltip>
            )}
        </div>
    )
}

/**
 * 操作提示 modal
 */
export const PromptModal = ({ ...porps }: ModalFuncProps) => {
    confirm({
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        focusTriggerAfterClose: false, // 取消后不触发按钮聚焦
        okText: __('确定'),
        cancelText: __('取消'),
        keyboard: false,
        ...porps,
    })
}

/**
 * 资源类型 tag
 * @param label 文本
 * @param color 颜色
 * @param bgColor 边框色
 */
export const ResourceTag: React.FC<{
    data?: {
        text: string
        color: string
        background: string
    }
}> = ({ data }) => {
    return data?.text ? (
        <div className={styles.resourceTag}>
            <div
                className={styles.name}
                style={{
                    color: data?.color || 'rgb(0 0 0 / 85%)',
                    background: data?.background || 'rgba(0, 0, 0, 0.06)',
                }}
            >
                {data?.text}
            </div>
        </div>
    ) : (
        ''
    )
}

/**
 * 资源失效 tag
 */
export const ResourceInvalidTag: React.FC = () => {
    return <div className={styles.resourceInvalidTag}>{__('已失效')}</div>
}

/**
 * 分组头 view
 */
export const GroupHeader: React.FC<{
    text?: string
}> = ({ text }) => {
    return (
        <div className={styles.groupHeader}>
            <div className={styles.line} />
            <div className={styles.title}>{text}</div>
        </div>
    )
}

/**
 * 空数据
 */
export const renderEmpty = (marginTop: number = 36) => (
    <Empty
        iconSrc={dataEmpty}
        desc={__('暂无数据')}
        style={{ marginTop, width: '100%' }}
    />
)

/**
 * 加载中
 */
export const renderLoader = (marginTop: number = 104) => (
    <div style={{ marginTop, width: '100%' }}>
        <Loader />
    </div>
)

/**
 * 获取Query数据
 */
const getQueryData = (search: string): any => {
    const keyValueData = search
        .replace(/^\?{1}/, '')
        .replace('?', '&')
        .split('&')
        .filter((current) => current)
    const queryData = keyValueData.reduce((preData, currentData) => {
        const [key, value] = currentData.split('=')
        return {
            ...preData,
            [key]: value,
        }
    }, {})
    return queryData
}

/**
 * 组装url
 */
export const changeUrlData = (
    params: { [key: string]: string },
    deleteParams: Array<string> = [],
    targetUrl: string = '',
) => {
    const url = targetUrl || window.location.pathname
    const queryData = getQueryData(window.location.search)
    const newData = { ...queryData, ...params }
    const searchData = Object.keys(newData)
        .filter((currentData) => !deleteParams.includes(currentData))
        .map((currentData) => `${currentData}=${newData[currentData]}`)
    return searchData.length ? `${url}?${searchData.join('&')}` : url
}
