import { FC } from 'react'
import styles from './styles.module.less'
import __ from '../locale'

interface ICompletenessCardProps {
    title: string
    score: number | null
    description: string
    key?: string
}
const CompletenessCard: FC<ICompletenessCardProps> = ({
    title,
    score,
    description,
    key,
}) => {
    return (
        <div className={styles.completenessCardContainer} key={key}>
            <div className={styles.title}>{title}</div>
            <div className={styles.scoreContainer}>
                <span className={styles.score}>
                    {score === null || score === undefined ? '--' : score}
                </span>
                {score === null || score === undefined ? null : (
                    <span className={styles.unit}>{__('分')}</span>
                )}
            </div>
            <div className={styles.description}>{description}</div>
        </div>
    )
}

export default CompletenessCard
