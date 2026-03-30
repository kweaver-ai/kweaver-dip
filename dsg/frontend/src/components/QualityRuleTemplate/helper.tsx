import { Tooltip } from 'antd'
import { QuestionCircleOutlined } from '@ant-design/icons'
import __ from './locale'
import { SearchType } from '@/components/SearchLayout/const'
import {
    ExplorationRuleTabs,
    ExplorationRule,
    ExplorationPeculiarity,
} from '../DatasheetView/DatasourceExploration/const'
import {
    qualityDimensionOptions,
    startOptions,
    detectionTitleText,
} from './const'
import styles from './styles.module.less'

const NoneQualityDimension = [
    ExplorationPeculiarity.Validity,
    ExplorationPeculiarity.Consistency,
]
export const searchFormInitData = [
    {
        label: __('质量检测规则'),
        key: 'keyword',
        type: SearchType.Input,
        isAlone: true,
    },
    {
        label: __('规则类型'),
        key: 'rule_level',
        type: SearchType.Select,
        itemProps: {
            allowClear: true,
            placeholder: __('请选择'),
            options: ExplorationRuleTabs.map((o) => ({
                ...o,
                value: o.key,
                // label:
                //     o.key === ExplorationRule.DataView
                //         ? __('库表级规则')
                //         : `${o.label}${__('规则')}`,
            })),
        },
    },
    {
        label: __('质量维度'),
        key: 'dimension',
        type: SearchType.Select,
        itemProps: {
            allowClear: true,
            placeholder: __('请选择'),
            options: qualityDimensionOptions?.filter(
                (o) => !NoneQualityDimension.includes(o.value),
            ),
        },
    },
    {
        label: __('是否启用'),
        key: 'enable',
        type: SearchType.Select,
        itemProps: {
            allowClear: true,
            placeholder: __('请选择'),
            options: startOptions,
        },
    },
]

export const detectionTitle = () => {
    return (
        <>
            {__('操作')}
            <Tooltip
                color="#fff"
                overlayInnerStyle={{
                    color: 'rgba(0,0,0,0.85)',
                }}
                overlayStyle={{ maxWidth: 430 }}
                placement="top"
                getPopupContainer={(node) =>
                    node?.parentElement?.parentElement
                        ?.parentElement as HTMLElement
                }
                title={
                    <div className={styles.titleTipsWrapper}>
                        {detectionTitleText.map((o) => {
                            return (
                                <div key={o.key}>
                                    <div className={styles.firTitle}>
                                        {o.title}
                                    </div>
                                    <div className={styles.secTitle}>
                                        {o?.secTitle?.map((i) => {
                                            return (
                                                <div
                                                    className={
                                                        styles.secTitleItem
                                                    }
                                                    key={i}
                                                >
                                                    <span
                                                        className={styles.dot}
                                                    />
                                                    {i}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {/* <div className={styles.secTitle}>
                                        {o?.threeTitle?.map((i) => {
                                            return (
                                                <div
                                                    className={
                                                        styles.threeTitle
                                                    }
                                                >
                                                    {i}
                                                </div>
                                            )
                                        })}
                                    </div> */}
                                </div>
                            )
                        })}
                    </div>
                }
            >
                <QuestionCircleOutlined className={styles.titleTipIcon} />
            </Tooltip>
        </>
    )
}
