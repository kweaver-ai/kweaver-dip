import { CaretRightFilled } from '@ant-design/icons'
import { FontIcon } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { FormTableKind } from '../Forms/const'
import { IconType } from '@/icons/const'

interface TypeShowProps {
    type: FormTableKind
}
const TypeShow = ({ type }: TypeShowProps) => {
    return (
        <div className={styles['type-show-container']}>
            {/* {type === FormTableKind.DATA_ORIGIN && (
                <div className={styles['business-form']}>
                    <MarkGreenColored className={styles['business-icon']} />
                    <span className={styles.desc}>{__('业务表')}</span>
                </div>
            )} */}
            <div className={styles['business-form']}>
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-shujubiaoicon"
                    className={styles['business-icon']}
                />
                <span className={styles.desc}>{__('数据表')}</span>
            </div>
            <div
                className={styles['business-form']}
                hidden={type === FormTableKind.DATA_ORIGIN}
            >
                <div className={styles.lineContainer}>
                    <div className={styles.line} />
                    <CaretRightFilled
                        style={{ color: 'rgba(0, 0, 0, 0.65)' }}
                    />
                </div>
                <span className={styles.desc}>{__('映射')}</span>
            </div>
            {type !== FormTableKind.DATA_ORIGIN && (
                <div className={styles['business-form']}>
                    <div className={styles.configIcon}>
                        <FontIcon
                            name="icon-bianjiqi"
                            style={{
                                fontSize: 10,
                            }}
                        />
                    </div>
                    <span className={styles.desc}>
                        {type === FormTableKind.DATA_FUSION
                            ? __('融合规则')
                            : __('取值规则')}
                    </span>
                </div>
            )}
        </div>
    )
}

export default TypeShow
