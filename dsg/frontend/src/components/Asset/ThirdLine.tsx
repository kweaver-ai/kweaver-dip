import { Radio } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { RadarMap, LineMap } from './g2plotConfig'
import { g2data3, g2data4, top3 } from './data'
import { CrownColored } from '@/icons'

function ThirdLine() {
    return (
        <div className={styles.thirdLine}>
            <div className={styles.thirdLineItem}>
                <div className={styles.left}>
                    <div className={styles.tips}>数据质量报告</div>
                    <div className={styles.graphWrapper}>
                        <RadarMap dataInfo={g2data3} />
                    </div>
                </div>
            </div>
            <div className={styles.thirdLineItem}>
                <div className={styles.left}>
                    <div className={styles.tips}>数据标准化率</div>
                    <div className={styles.radioWrapper}>
                        <Radio.Group value={1}>
                            <Radio value={1}>近七天</Radio>
                            <Radio value={2}>近一月</Radio>
                        </Radio.Group>
                    </div>
                    <div className={styles.graphWrapper}>
                        <LineMap dataInfo={g2data4} />
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.tips}>
                        <CrownColored
                            style={{ fontSize: '20px', marginRight: '8px' }}
                        />
                        TOP 3 业务领域名称
                    </div>
                    {top3.slice(0, 6).map((item) => {
                        return (
                            <div
                                className={styles.detailWrapper}
                                key={item.index}
                            >
                                <span className={styles.circle}>
                                    {item.index}
                                </span>
                                <div className={styles.data}>
                                    <span className={styles.type}>
                                        {item.name}
                                    </span>
                                    <span className={styles.value}>
                                        {item.count}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default ThirdLine
