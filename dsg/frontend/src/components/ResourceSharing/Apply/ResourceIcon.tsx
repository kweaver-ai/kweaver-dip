import React, { CSSProperties } from 'react'
import {
    AppApiColored,
    AppDataContentColored,
    DatasheetViewColored,
} from '@/icons'
import styles from './styles.module.less'
import { ApplyResource } from '../const'

interface IGetIcon {
    type: string
    className?: string
    style?: CSSProperties
}

const ResourceIcon: React.FC<IGetIcon> = ({ type, style = {} }) => {
    const getIcon = (t: string) => {
        switch (t) {
            case ApplyResource.File:
                return (
                    <AppDataContentColored
                        className={styles.resourceIcon}
                        style={style}
                    />
                )
            case ApplyResource.Database:
                return (
                    <DatasheetViewColored
                        className={styles.resourceIcon}
                        style={style}
                    />
                )
            case ApplyResource.Interface:
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
