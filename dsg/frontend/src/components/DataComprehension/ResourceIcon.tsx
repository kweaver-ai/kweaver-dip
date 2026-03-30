import React, { CSSProperties } from 'react'
import { AppApiColored, DatasheetViewColored } from '@/icons'
import styles from './styles.module.less'

interface IGetIcon {
    type: number
    className?: string
    style?: CSSProperties
}

const ResourceIcon: React.FC<IGetIcon> = ({ type, style = {} }) => {
    const getIcon = (t: number) => {
        switch (t) {
            case 1:
                return (
                    <DatasheetViewColored
                        className={styles.resourceIcon}
                        style={style}
                    />
                )
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
