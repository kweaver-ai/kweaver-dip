import React, { CSSProperties } from 'react'
import { AppApiColored, DatasheetViewColored } from '@/icons'
import styles from './styles.module.less'
import { ApplyResource } from '../const'

interface IGetIcon {
    type: string | number
    className?: string
    style?: CSSProperties
}

const ResourceIcon: React.FC<IGetIcon> = ({ type, style = {} }) => {
    const getIcon = (t: string | number) => {
        switch (t) {
            case ApplyResource.Database:
            case 1:
                return (
                    <DatasheetViewColored
                        className={styles.resourceIcon}
                        style={style}
                    />
                )
            case ApplyResource.Interface:
            case 2:
                return (
                    <AppApiColored
                        className={styles.resourceIcon}
                        style={style}
                    />
                )
            default:
                return ''
        }
    }
    return getIcon(type)
}
export default ResourceIcon
