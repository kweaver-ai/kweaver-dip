import classNames from 'classnames'
import { AttributeOutlined, LogicEntityColored } from '@/icons'
import __ from './locale'
import styles from './styles.module.less'
import { BusinessDomainType } from './const'
import { GlossaryIcon } from './GlossaryIcons'
import { getPlatformNumber } from '@/utils'

const TypeShow = () => {
    const platformNumber = getPlatformNumber()
    return (
        <div className={styles.typeShow}>
            <div className={styles.typeItem}>
                <div className={styles.iconBack}>
                    <GlossaryIcon
                        type={BusinessDomainType.business_object}
                        fontSize="22px"
                        width="22px"
                        styles={{ flexShrink: 0 }}
                    />
                </div>
                <span className={styles.typeName}>{__('业务对象')}</span>
            </div>
            {/* {platformNumber === 1 && (
                <div className={styles.typeItem}>
                    <div className={styles.iconBack}>
                        <GlossaryIcon
                            type={BusinessDomainType.business_activity}
                            fontSize="22px"
                            width="22px"
                            styles={{ flexShrink: 0 }}
                        />
                    </div>
                    <span className={styles.typeName}>{__('业务活动')}</span>
                </div>
            )} */}

            <div className={styles.typeItem}>
                <div className={styles.iconBack}>
                    <LogicEntityColored
                        className={classNames(styles.icon, styles.logicIcon)}
                    />
                </div>
                <span className={styles.typeName}>{__('逻辑实体')}</span>
            </div>
            <div className={styles.typeItem}>
                <div className={styles.iconBack}>
                    <AttributeOutlined
                        className={classNames(styles.icon, styles.attrIcon)}
                    />
                </div>
                <span className={styles.typeName}>{__('属性')}</span>
            </div>
        </div>
    )
}
export default TypeShow
