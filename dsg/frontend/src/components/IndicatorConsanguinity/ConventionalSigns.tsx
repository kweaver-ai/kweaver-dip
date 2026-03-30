import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'
import { TabsKey } from '../IndicatorManage/const'
import { IndicatorColor, IndicatorNodeType } from './const'
import __ from './locale'
import { FontIcon, TableFactColored } from '@/icons'
import styles from './styles.module.less'
import { IconType } from '@/icons/const'
import IndicatorIcons from '../IndicatorManage/IndicatorIcons'

const conventionalSignsConfig = [
    {
        type: TabsKey.ATOMS,
        Icon: (
            <div
                style={{
                    background: IndicatorColor?.[TabsKey.ATOMS],
                }}
                className={styles.iconContainer}
            >
                <IndicatorIcons
                    type={TabsKey.ATOMS}
                    style={{
                        color: '#fff',
                        fontSize: 14,
                    }}
                />
            </div>
        ),
        name: __('原子指标'),
    },
    {
        type: TabsKey.DERIVE,
        Icon: (
            <div
                style={{
                    background: IndicatorColor?.[TabsKey.DERIVE],
                }}
                className={styles.iconContainer}
            >
                <IndicatorIcons
                    type={TabsKey.DERIVE}
                    style={{
                        color: '#fff',
                        fontSize: 14,
                    }}
                />
            </div>
        ),
        name: __('衍生指标'),
    },

    {
        type: TabsKey.RECOMBINATION,
        Icon: (
            <div
                style={{
                    background: IndicatorColor?.[TabsKey.RECOMBINATION],
                }}
                className={styles.iconContainer}
            >
                <IndicatorIcons
                    type={TabsKey.RECOMBINATION}
                    style={{
                        color: '#fff',
                        fontSize: 14,
                    }}
                />
            </div>
        ),
        name: __('复合指标'),
    },
    {
        type: IndicatorNodeType.DATAFORMNODE,
        Icon: (
            <div className={styles.iconContainer}>
                <FontIcon
                    name="icon-shujubiao"
                    type={IconType.COLOREDICON}
                    style={{
                        fontSize: 14,
                    }}
                />
            </div>
        ),
        name: __('数据表'),
    },
]

const ConventionalSigns = () => {
    return (
        <div className={styles.conventionalSignsContainer}>
            {conventionalSignsConfig.map((conventional) => (
                <div
                    key={conventional.name}
                    className={styles.itemConventional}
                >
                    {conventional.Icon}
                    <div className={styles.name}>{conventional.name}</div>
                </div>
            ))}
        </div>
    )
}

export default ConventionalSigns
