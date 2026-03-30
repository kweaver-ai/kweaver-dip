import React, { useCallback, useMemo } from 'react'
import { Steps } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import moment from 'moment'
import __ from '../locale'
import styles from './styles.module.less'
import { DemandStatusEnum } from '../const'
import { DemandPhaseEnum, IProcessInfo } from '@/core'

interface IProgress {
    status: DemandStatusEnum
    progress: IProcessInfo[]
}
const Progress: React.FC<IProgress> = ({ status, progress }) => {
    const currentStep = useMemo(() => {
        const indx = progress.findLastIndex((p) => p.op_user && p.op_time)
        return indx > -1 ? indx + 1 : progress.length
    }, [progress])

    const getCurrentStepInfo = (phase: DemandPhaseEnum) => {
        const res = progress.find((p) => p.phase === phase)

        return res
            ? {
                  ...res,
                  op_user: res?.op_user || '--',
                  op_time: res?.op_time
                      ? moment(res?.op_time).format('YYYY-MM-DD HH:mm:ss')
                      : '--',
              }
            : res
    }

    const items = useMemo(() => {
        const allItems = [
            {
                title: __('需求申请'),
                description: (
                    <div className={styles.infos}>
                        <div
                            className={styles.info}
                            title={
                                getCurrentStepInfo(DemandPhaseEnum.Apply)
                                    ?.op_user
                            }
                        >
                            {__('申请人：')}
                            {getCurrentStepInfo(DemandPhaseEnum.Apply)?.op_user}
                        </div>
                        <div className={styles.info}>
                            {__('申请时间：')}
                            {getCurrentStepInfo(DemandPhaseEnum.Apply)?.op_time}
                        </div>
                    </div>
                ),
                key: DemandPhaseEnum.Apply,
            },
            {
                title: __('需求分析'),
                description: (
                    <div className={styles.infos}>
                        <div
                            className={styles.info}
                            title={
                                getCurrentStepInfo(DemandPhaseEnum.Analysis)
                                    ?.op_user
                            }
                        >
                            {__('分析人：')}
                            {
                                getCurrentStepInfo(DemandPhaseEnum.Analysis)
                                    ?.op_user
                            }
                        </div>
                        <div className={styles.info}>
                            {__('完成时间：')}
                            {
                                getCurrentStepInfo(DemandPhaseEnum.Analysis)
                                    ?.op_time
                            }
                        </div>
                    </div>
                ),
                key: DemandPhaseEnum.Analysis,
            },
            {
                title: __('需求实施'),
                description: (
                    <div className={styles.infos}>
                        <div
                            className={styles.info}
                            title={
                                getCurrentStepInfo(DemandPhaseEnum.Implement)
                                    ?.op_user
                            }
                        >
                            {__('实施人：')}
                            {
                                getCurrentStepInfo(DemandPhaseEnum.Implement)
                                    ?.op_user
                            }
                        </div>
                        <div className={styles.info}>
                            {__('完成时间：')}
                            {
                                getCurrentStepInfo(DemandPhaseEnum.Implement)
                                    ?.op_time
                            }
                        </div>
                    </div>
                ),
                key: DemandPhaseEnum.Implement,
            },
            {
                title: __('需求验收'),
                description: (
                    <div
                        className={styles.infos}
                        title={
                            getCurrentStepInfo(DemandPhaseEnum.implementAccept)
                                ?.op_user
                        }
                    >
                        <div className={styles.info}>
                            {__('验收人：')}
                            {
                                getCurrentStepInfo(
                                    DemandPhaseEnum.implementAccept,
                                )?.op_user
                            }
                        </div>
                        <div className={styles.info}>
                            {__('验收时间：')}
                            {
                                getCurrentStepInfo(
                                    DemandPhaseEnum.implementAccept,
                                )?.op_time
                            }
                        </div>
                    </div>
                ),
                key: DemandPhaseEnum.implementAccept,
            },
            {
                title: __('需求关闭'),
                description: (
                    <div className={styles.infos}>
                        {/* <div className={styles.info}>
                            {__('操作人：')}
                            {getCurrentStepInfo(DemandPhaseEnum.Close)?.op_user}
                        </div> */}
                        <div className={styles.info}>
                            {__('关闭时间：')}
                            {getCurrentStepInfo(DemandPhaseEnum.Close)?.op_time}
                        </div>
                    </div>
                ),
                key: DemandPhaseEnum.Close,
            },
        ]
        return allItems.filter((item) =>
            progress.find((p) => p.phase === item.key),
        )
    }, [progress])

    return (
        <div className={styles['progress-wrapper']}>
            {getCurrentStepInfo(DemandPhaseEnum.Cancel)?.op_user ? (
                <>
                    <div className={styles['title-row']}>
                        <div className={styles['close-icon-container']}>
                            <CloseOutlined className={styles['close-icon']} />
                        </div>
                        <span className={styles.title}>{__('需求已撤销')}</span>
                    </div>
                    <div className={styles.revoker}>
                        {__('需求撤销人：')}
                        {getCurrentStepInfo(DemandPhaseEnum.Cancel)?.op_user}
                    </div>
                    <div className={styles['revoke-time']}>
                        {__('撤销时间：')}
                        {getCurrentStepInfo(DemandPhaseEnum.Cancel)?.op_time}
                    </div>
                </>
            ) : (
                <Steps current={currentStep} items={items} />
            )}
        </div>
    )
}
export default Progress
