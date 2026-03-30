import React from 'react'
import styles from './styles.module.less'
import __ from './locale'

/**
 * 操作类型
 */
export enum OperateType {
    // 创建
    CREATE = 'create',
    // 编辑
    EDIT = 'edit',
    // 配置
    CONFIG = 'config',
    // 刷新
    REFRESH = 'refresh',
    // 刷新单个
    REFRESHITEM = 'refreshItem',
    // 删除
    DELETE = 'delete',
    // 停用/启用
    STATE = 'state',
    // 跳转
    JUMP = 'jump',
    // 配置类目树
    CONFIGTREE = 'configtree',
}

// 类目状态
export const StateLabel: React.FC<{ state: boolean }> = ({ state }) => {
    switch (state) {
        case true:
            return (
                <div className={styles.categoryStateLabel}>{__('启用中')}</div>
            )
        case false:
            return (
                <div
                    className={styles.categoryStateLabel}
                    style={{
                        color: '#FF4D4F',
                        background: 'rgba(255,77,79,0.07)',
                    }}
                >
                    {__('已停用')}
                </div>
            )
        default:
            return <div />
    }
}
