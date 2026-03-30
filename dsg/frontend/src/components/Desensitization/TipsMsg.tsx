import ruleTip from '@/assets/ruleTips.png'
import styles from './styles.module.less'
import { methods } from './Config'
import __ from './locale'

export const MethodsTips = () => {
    return (
        <>
            {methods.map((item) => (
                <div key={item.label} className={styles.methodsTip}>
                    <span>{item.label}</span>
                    <span>{item.desc}</span>
                </div>
            ))}
        </>
    )
}

export const RulesTips = () => {
    return (
        <div>
            <p>
                {__(
                    '脱敏算法包括 “算法” 及 “脱敏方式” 的配置，引用了算法的敏感数据将按照规则进行脱敏。',
                )}
            </p>
            <p>{__('脱敏示例')}：</p>
            <img src={ruleTip} alt="demo" width={307} />
            <p className={styles.notice}>
                {__(
                    '注意：当前页面仅做脱敏算法配置，实际数据是否需要进行脱敏，仍需要做相关的策略配置（如：隐私数据保护策略）',
                )}
            </p>
        </div>
    )
}
