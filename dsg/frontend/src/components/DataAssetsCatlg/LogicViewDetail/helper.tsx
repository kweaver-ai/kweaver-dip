import Icon, { InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { Tooltip, Spin, Divider } from 'antd'
import moment from 'moment'
import { isString } from 'lodash'
import { useEffect, useState } from 'react'
import __ from './locale'
import { DepartmentOutlined, ThemeOutlined } from '@/icons'
import { ReactComponent as userOutlined } from '@/assets/DataAssetsCatlg/userOutlined.svg'
import styles from '../styles.module.less'
import { chineseReg } from '@/utils'
import { PolicyActionEnum, getBusinessUpdateTime, formatError } from '@/core'
import {
    openTypeList,
    shareTypeList,
    updateCycleOptions,
} from '@/components/ResourcesDir/const'

// 业务逻辑实体列表项参数
export const itemOtherInfo = [
    {
        infoKey: 'subject',
        title: <ThemeOutlined style={{ fontSize: 16 }} />,
        toolTipTitle: `${__('所属业务对象：')}`,
    },
    {
        infoKey: 'department',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门：')}`,
    },
    {
        infoKey: 'owners',
        title: (
            <Icon
                component={userOutlined}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据Owner：')}`,
    },
    // {
    //     infoKey: 'access',
    //     title: (
    //         <FontIcon
    //             name="icon-ziyuanquanxian"
    //             className={styles.commonIcon}
    //             type={IconType.FONTICON}
    //             style={{ fontSize: 16, marginRight: '8px' }}
    //         />
    //     ),
    //     toolTipTitle: `${__('权限：')}`,
    // },
]

// 列表-库表卡片-参数详情项
export const viewCardBaiscInfoList = [
    {
        label: __('编码：'),
        value: '',
        key: 'uniform_catalog_code',
        span: 24,
    },
    {
        label: __('技术名称：'),
        value: '',
        key: 'technical_name',
        span: 24,
    },
    {
        label: __('业务数据更新时间：'),
        value: '',
        key: 'business_update_time',
        span: 24,
    },
    {
        label: __('数据Owner：'),
        value: '',
        key: 'owners',
        span: 24,
    },
    {
        label: __('描述：'),
        value: '',
        key: 'description',
        span: 24,
    },
    {
        key: 'update_cycle',
        label: `${__('更新周期')}：`,
        options: updateCycleOptions,
        value: '',
        span: 24,
    },
    {
        key: 'info_system',
        label: `${__('关联系统')}：`,
        value: '',
        span: 24,
    },
    {
        key: 'shared_type',
        label: `${__('共享属性')}：`,
        options: shareTypeList,
        value: '',
        span: 24,
    },
    {
        key: 'open_type',
        label: `${__('开放属性')}：`,
        options: openTypeList,
        value: '',
        span: 24,
    },
]
export const replaceMonthWithNumber = (p1) => {
    const monthMap = {
        January: '01',
        Jan: '01',
        February: '02',
        Feb: '02',
        March: '03',
        Mar: '03',
        April: '04',
        Apr: '04',
        May: '05',
        June: '06',
        Jun: '06',
        July: '07',
        Jul: '07',
        August: '08',
        Aug: '08',
        September: '09',
        Sep: '09',
        Sept: '09',
        October: '10',
        Oct: '10',
        November: '11',
        Nov: '11',
        December: '12',
        Dec: '12',
        '': '',
    }
    return monthMap[p1]
}

export const getScore = (val, canZero = true) => {
    return val ? Math.trunc(val * 10000) / 100 : canZero ? 0 : val
}

export const isValidTime = (time: any) => {
    try {
        const mon = isString(time) ? time.match(/[a-zA-Z]+/)?.[0] || '' : ''
        const isDayStart =
            /^\d{2}-/.test(time) && Number(time.substring(3, 5)) < 13
        const timeStr = isDayStart
            ? // 处理 DD-MM-YYYY 02-03-2006
              moment(time, 'DD-MM-YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:ss')
            : moment(time).isValid()
            ? time
            : // 处理 02/03/2006:15:04:05 MST
            time.split(':')?.length > 2
            ? time.replace(/:/, ' ')
            : mon
            ? time
                  // 处理 02/Jan/2006:15:04:05 MST
                  .replace(mon, replaceMonthWithNumber(mon))
            : time
                  // 处理 2006年01月02日 15时04分
                  .replace(chineseReg, '')
                  // 处理 2006-01-02T15:04:05.000Z
                  .replace(/T/, ' ')
        const isTime = moment(timeStr).isValid()
        const date = isTime
            ? moment(timeStr).format('YYYY-MM-DD HH:mm:ss')
            : time
        return { isTime, date }
    } catch (err) {
        return { isTime: false, time }
    }
}

export const TimeRender = ({
    formViewId,
    deafText,
    timeField,
    placement,
}: {
    formViewId: string
    deafText?: string
    timeField?: any
    placement?: any
}) => {
    const [filed, setFiled] = useState<string>('')
    const [timeStr, setTimeStr] = useState<string>('')
    const [isTime, setIsTime] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        if (timeField?.business_update_time) {
            getTiemInfo(timeField)
        } else if (formViewId) {
            getTime()
        }
    }, [formViewId])

    const getTime = async () => {
        try {
            setLoading(true)
            const res = await getBusinessUpdateTime(formViewId)
            getTiemInfo(res)
        } catch (err) {
            // formatError(err)
        } finally {
            setLoading(false)
        }
    }

    const getTiemInfo = (res: any) => {
        setFiled(res?.field_business_name || '')
        const curTime = res?.business_update_time
        // 年月日时间，至少为8位：20240102
        const isTimeFlag = isValidTime(curTime)?.isTime && curTime?.length > 7
        setIsTime(isTimeFlag)
        // dotInd > 14 过滤 2024.07.12类型时间，处理2024-07-12 08:00:00.458带毫秒时间
        const dotInd = curTime?.indexOf('.')
        setTimeStr(
            isTimeFlag
                ? isString(curTime)
                    ? dotInd > 14
                        ? curTime.substring(0, dotInd)
                        : curTime
                    : moment(curTime).format('YYYY-MM-DD HH:mm:ss')
                : deafText || '--',
        )
    }

    return loading ? (
        <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
    ) : filed ? (
        <span style={{ display: 'flex', alignItems: 'center' }}>
            <span
                style={{
                    display: 'inline-block',
                    maxWidth: '240px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
                title={timeStr}
            >
                {timeStr}
            </span>
            <Tooltip
                getPopupContainer={(n) => n.parentElement?.parentElement || n}
                placement={placement}
                title={
                    isTime ? (
                        __('数据取值于「${fied}」字段', {
                            fied: filed || '',
                        })
                    ) : (
                        <div>
                            <div>
                                {__('来源字段：')}
                                {filed}
                            </div>
                            <div>{__('数据异常，无法正常展示')}</div>
                        </div>
                    )
                }
            >
                <InfoCircleOutlined
                    style={{
                        color: 'rgb(0 0 0 / 45%)',
                        marginLeft: '4px',
                        fontSize: '16px',
                    }}
                />
            </Tooltip>
        </span>
    ) : (
        deafText || '--'
    )
}

export const ActionText = {
    [PolicyActionEnum.View]: __('查看'),
    [PolicyActionEnum.Read]: __('读取'),
    [PolicyActionEnum.Download]: __('下载'),
    [PolicyActionEnum.Auth]: __('授权'),
    [PolicyActionEnum.Allocate]: __('授权(仅分配)'),
}

export enum SampleOptionValue {
    Sample = 'sample',
    Synthetic = 'synthetic',
}

/**
 * 获取收藏禁用提示信息
 */
export const getDisabledTooltip = ({
    isPublished,
    isOnline,
    action,
}: {
    isPublished: boolean
    isOnline: boolean
    action: 'favorite' | 'feedback'
}) => {
    if (!isPublished) {
        return action === 'favorite'
            ? __('资源未发布，不能进行收藏')
            : __('资源未发布，不能进行反馈')
    }

    // 如果未上线，提示未上线
    if (!isOnline) {
        return action === 'favorite'
            ? __('资源未上线，不能进行收藏')
            : __('资源未上线，不能进行反馈')
    }

    return ''
}
export const showDivder = (divdStyle?: any) => {
    return (
        <Divider
            style={{
                height: '12px',
                borderRadius: '1px',
                borderLeft: '1px solid rgba(0,0,0,0.24)',
                margin: '0px 2px 0px 12px',
                ...divdStyle,
            }}
            type="vertical"
        />
    )
}

export const getShareAndOpenType = (data: any) => {
    const items: any[] = [
        {
            key: 'update_cycle',
            title: __('更新周期'),
            options: updateCycleOptions,
            value: '',
        },
        {
            key: 'shared_type',
            title: __('共享属性'),
            options: shareTypeList,
            value: '',
        },
        {
            key: 'open_type',
            title: __('开放属性'),
            options: openTypeList,
            value: '',
        },
    ]
    return (
        <div className={styles.itemOtherInfoBox}>
            {items.map((item, index) => {
                const value =
                    item?.options?.find((v) => v.value === data?.[item.key])
                        ?.label || '--'
                return (
                    <>
                        <div className={styles.itemDetailInfo}>
                            <span>{item.title}：</span>
                            <span className={styles.ruleText}>{value}</span>
                        </div>
                        <span className={styles.divider}>
                            {index < items.length - 1 && showDivder()}
                        </span>
                    </>
                )
            })}
        </div>
    )
}
