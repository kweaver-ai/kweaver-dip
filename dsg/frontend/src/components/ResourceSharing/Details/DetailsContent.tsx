import React, { CSSProperties } from 'react'
import classnames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { GroupHeader } from '../helper'
import DetailsGroup from './DetailsGroup'
import { ISSZDDict } from '@/core'

interface IDetailsGroup {
    data?: any
    config?: any[]
    style?: CSSProperties
    center?: boolean
    // 字典信息
    dict?: ISSZDDict
}

/**
 * 详情内容
 */
const DetailsContent = ({
    data,
    config = [],
    style = {},
    center = false,
    dict,
}: IDetailsGroup) => {
    return (
        <div
            className={classnames(
                styles.detailsContent,
                center && styles.detailsContent_center,
            )}
            style={style}
        >
            {config.map((group, idx) => (
                <div key={idx}>
                    <GroupHeader text={group.title} />
                    <div className={styles.group}>
                        <DetailsGroup
                            config={group.content}
                            data={data}
                            labelWidth="140px"
                            dict={dict}
                        />
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DetailsContent
