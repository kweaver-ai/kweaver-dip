import React from 'react'
import classnames from 'classnames'
import { DepartmentOutlined, FontIcon, OrganizationOutlined } from '@/icons'
import styles from './styles.module.less'
import { getDepartLabelByDepartments } from '../../helper'
import __ from './locale'

const getIconByType = (type: any, fontSize?: string) => {
    switch (type) {
        case 'department':
            return <DepartmentOutlined />
        case 'organization':
            return <OrganizationOutlined />
        default:
            return (
                <FontIcon
                    name="icon-touxiang"
                    style={{ fontSize: fontSize || '16px' }}
                />
            )
    }
}

function VisitorLabel({ data, showDep = false }: any) {
    const { title, tip } = getDepartLabelByDepartments(data?.parent_deps)

    return (
        <div className={classnames(styles['visitor-label'], 'title-label')}>
            <div className={styles['visitor-label-icon']} title={data?.name}>
                {getIconByType(data?.type, showDep ? '18px' : '16px')}
            </div>
            <div className={styles['visitor-label-titleWrap']}>
                <div
                    className={styles['visitor-label-title']}
                    title={data?.name}
                >
                    {data?.name}
                </div>
                {showDep && (
                    <div
                        className={styles['visitor-label-path']}
                        title={tip || __('未分配')}
                    >
                        {__('部门：')}
                        {title || __('未分配')}
                    </div>
                )}
            </div>
        </div>
    )
}

export default VisitorLabel
