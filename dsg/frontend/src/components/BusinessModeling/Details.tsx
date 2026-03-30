import React, { useEffect, useState } from 'react'
import { BizModelType, ICoreBusinessDetails, LoginPlatform } from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { basicInfoFields } from './const'
import { formatTime, getPlatformNumber } from '@/utils'
import { useBusinessModelContext } from './BusinessModelProvider'

interface IDetails {
    data?: ICoreBusinessDetails
}
const Details: React.FC<IDetails> = ({ data }) => {
    const { businessModelType } = useBusinessModelContext()
    const platformNumber = getPlatformNumber()
    return (
        <div className={styles.detailstWrapper}>
            {basicInfoFields.map((item) => (
                <div className={styles.row} key={item.keys[0]}>
                    <div className={styles.label}>
                        {businessModelType === BizModelType.DATA &&
                        item.keys.includes('name')
                            ? __('数据模型名称')
                            : item.keys.includes('business_domain_name') &&
                              platformNumber !== LoginPlatform.default
                            ? __('关联主干业务')
                            : item.label}
                    </div>
                    <div className={styles.values}>
                        {item.keys.map((key, index) => (
                            <div className={styles.value} key={key}>
                                {index === 0
                                    ? Array.isArray(data?.[key])
                                        ? data?.[key].length > 0
                                            ? data?.[key].join('、')
                                            : '--'
                                        : data?.[key] || '--'
                                    : formatTime(data?.[key])}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )
}
export default Details
