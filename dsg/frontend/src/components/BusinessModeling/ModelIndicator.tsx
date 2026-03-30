import { useNavigate } from 'react-router-dom'
import classnames from 'classnames'
import React from 'react'
import { Button } from 'antd'
import { IndicatorTaskColored } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { OperateType } from '@/utils'
import { TabKey, ViewMode } from './const'
import { useBusinessModelContext } from './BusinessModelProvider'
import { BizModelType } from '@/core'

interface IModelIndicator {
    modelCount?: number
    indicatorCount?: number
    modelId: string
    domainId: string
}
const ModelIndicator: React.FC<IModelIndicator> = ({
    modelCount = 0,
    indicatorCount = 0,
    modelId,
    domainId,
}) => {
    // const [createIndicatorVisible, setCreateIndicatorVisible] = useState(false)
    const navigate = useNavigate()
    const { businessModelType } = useBusinessModelContext()

    const goInto = () => {
        if (businessModelType === BizModelType.BUSINESS) {
            navigate(
                `/coreBusiness/${modelId}?domainId=${domainId}&targetTab=${TabKey.INDICATOR}&viewType=${ViewMode.BArchitecture}`,
            )
        } else {
            navigate(
                `/coreData/${modelId}?domainId=${domainId}&targetTab=${TabKey.INDICATOR}&viewType=${ViewMode.BArchitecture}`,
            )
        }
    }

    const gotoCreateIndicator = () => {
        if (businessModelType === BizModelType.BUSINESS) {
            navigate(
                `/coreBusiness/${modelId}?domainId=${domainId}&targetTab=${TabKey.INDICATOR}&viewType=${ViewMode.BArchitecture}&optType=${OperateType.CREATE}`,
            )
        } else {
            navigate(
                `/coreData/${modelId}?domainId=${domainId}&targetTab=${TabKey.INDICATOR}&viewType=${ViewMode.BArchitecture}&optType=${OperateType.CREATE}`,
            )
        }
    }

    return (
        <>
            <div className={styles['left-content-item']}>
                <div className={styles['content-title']}>
                    <div className={styles['content-title-left']}>
                        <IndicatorTaskColored
                            className={classnames(
                                styles['indicator-icon'],
                                styles['content-title-icon'],
                            )}
                        />
                        {businessModelType === BizModelType.BUSINESS
                            ? __('业务指标')
                            : __('数据指标')}
                    </div>
                    <Button type="link" onClick={goInto}>
                        {__('查看全部')}
                    </Button>
                </div>
                {indicatorCount === 0 ? (
                    <Empty
                        desc={
                            businessModelType === BizModelType.BUSINESS
                                ? __('暂无业务指标，点击下方按钮可新建')
                                : __('暂无数据指标，点击下方按钮可新建')
                        }
                        iconSrc={dataEmpty}
                        onAdd={() => gotoCreateIndicator()}
                    />
                ) : (
                    <div className={styles.statistics}>
                        {/* <div className={styles['statistic-item']}>
                            <div className={styles['statistic-label']}>
                                {__('模型数')}
                            </div>
                            <div className={styles['statistic-value']}>
                                {modelCount}
                            </div>
                        </div> */}
                        <div
                            className={classnames(
                                styles['statistic-item'],
                                styles['statistic-item-single'],
                            )}
                        >
                            <div className={styles['statistic-label']}>
                                {__('指标数')}
                            </div>
                            <div className={styles['statistic-value']}>
                                {indicatorCount}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* {createIndicatorVisible && (
                <CreateModel
                    onClose={() => {
                        setCreateIndicatorVisible(false)
                    }}
                    modelValue={undefined}
                    mid={modelId}
                    viewType={OptionModel.CreateModel}
                    jumpWithWindow
                />
            )} */}
        </>
    )
}

export default ModelIndicator
