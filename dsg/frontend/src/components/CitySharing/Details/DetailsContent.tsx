import React, { CSSProperties } from 'react'
import classnames from 'classnames'
import __ from '../locale'
import styles from './styles.module.less'
import { GroupHeader, GroupSubHeader } from '../helper'
import DetailsGroup from './DetailsGroup'

export interface IDetailsGroup {
    data?: any
    config?: any[]
    style?: CSSProperties
    center?: boolean
}

/**
 * 详情内容
 */
const DetailsContent = ({
    data,
    config = [],
    style = {},
    center = false,
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
                    {group.title && <GroupHeader text={group.title} />}
                    {group.subTitle && <GroupSubHeader text={group.subTitle} />}
                    {group.content.length > 0 ? (
                        <div className={styles.group}>
                            <DetailsGroup
                                config={group.content}
                                data={data}
                                labelWidth="110px"
                            />
                        </div>
                    ) : group.render ? (
                        group.render()
                    ) : null}
                </div>
            ))}
        </div>
    )
}

export default DetailsContent
