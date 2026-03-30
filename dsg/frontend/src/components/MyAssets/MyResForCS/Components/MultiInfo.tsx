import classNames from 'classnames'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

interface IMultiInfoProps {
    name: string
    code: string
    iconName: string
    isDisabled?: boolean
    onClick?: () => void
}

const MultiInfo = ({
    name,
    code,
    iconName,
    isDisabled = false,
    onClick,
}: IMultiInfoProps) => {
    return (
        <div className={styles['multi-info-container']}>
            <FontIcon
                name={iconName}
                type={IconType.COLOREDICON}
                style={{ fontSize: 20 }}
            />
            <div className={styles['info-content']}>
                <div
                    className={classNames(
                        styles.name,
                        isDisabled && styles['name-offline'],
                    )}
                    title={name}
                    onClick={onClick}
                >
                    {name}
                </div>
                <div className={styles.code} title={code}>
                    {code}
                </div>
            </div>
        </div>
    )
}

export default MultiInfo
