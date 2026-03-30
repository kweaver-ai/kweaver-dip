import { InfoCircleOutlined } from '@ant-design/icons'
import { Tooltip } from 'antd'
import classnames from 'classnames'
import { useMemo } from 'react'
import moment from 'moment'
import { SubTitle } from '@/components/DataAssetsCatlg/helper'
import { TimeRender } from '@/components/DataAssetsCatlg/LogicViewDetail/helper'
import { Loader } from '@/ui'
import __ from '../locale'
import styles from '../styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

function UpdateTimeCard({ loading, data, field, isPass, onClick }: any) {
    const hasTime = data?.date

    const tip = useMemo(() => {
        return (
            <Tooltip
                title={
                    <span
                        style={{
                            color: 'rgba(0,0,0,0.85)',
                        }}
                    >
                        {__('来源字段：${fied}', {
                            fied: field || '--',
                        })}
                    </span>
                }
                color="white"
            >
                <InfoCircleOutlined className={styles.icon} />
            </Tooltip>
        )
    }, [field])
    return (
        <div className={styles.tagCardWrapper}>
            <div className={styles.pTimeTitle} title={data?.rule_name}>
                <div
                    className={styles.pTitle}
                    title={__('数据更新时间')}
                    onClick={(e) => {
                        e.preventDefault()
                        onClick?.()
                    }}
                >
                    {__('数据更新时间')}
                </div>
                ：
                <div className={styles.timeBox} hidden={!hasTime}>
                    <div className={styles.timeBoxInfo}>
                        <div className={styles.year}>{`${data?.year}${__(
                            '年',
                        )}${data?.month}${__('月')}`}</div>
                        <div className={styles.dayInfo}>
                            <span className={styles.day}>{data?.day}</span>
                            <span className={styles.unit}>{__('日')}</span>
                        </div>
                    </div>
                    <div className={styles.hms}>
                        {data?.hms}
                        {tip}
                    </div>
                </div>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div
                    className={classnames(
                        styles.tagInfo,
                        hasTime
                            ? isPass
                                ? styles.checkPass
                                : styles.checkError
                            : '',
                    )}
                >
                    {hasTime ? (
                        <div className={styles.checkState}>
                            <span className={styles.prevText}>
                                {__('数据及时性检查')}：
                            </span>
                            <FontIcon
                                name={
                                    isPass ? 'icon-chenggong' : 'icon-gantanhao'
                                }
                                type={IconType.COLOREDICON}
                            />
                            <span>{isPass ? __('已通过') : __('未通过')}</span>
                        </div>
                    ) : (
                        <div className={styles.timeEmpty}>
                            {__('暂无数据')}
                            {tip}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UpdateTimeCard
