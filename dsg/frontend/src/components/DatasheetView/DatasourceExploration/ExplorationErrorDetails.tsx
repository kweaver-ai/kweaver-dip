import React, { useEffect, useState } from 'react'
import { Modal, Collapse } from 'antd'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { DatasheetViewColored } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { IDetailsData } from './const'

const { Panel } = Collapse

interface IExplorationErrorDetails {
    open: boolean
    onClose: () => void
    detailsData?: IDetailsData
}

const ExplorationErrorDetails: React.FC<IExplorationErrorDetails> = ({
    open,
    onClose,
    detailsData,
}) => {
    const pageSize = 20
    const [pannelOffset, setPanelOffset] = useState<any>()

    useEffect(() => {
        if (detailsData?.details?.length > 0) {
            const obj: any = {}
            detailsData?.details?.forEach((item, index) => {
                obj[index] = 1
            })
            setPanelOffset(obj)
        }
    }, [])

    return (
        <div>
            <Modal
                title={__('查看异常库表')}
                onCancel={() => onClose()}
                open={open}
                width={800}
                className={styles.detailsdrawerWrapper}
                footer={null}
            >
                <div className={styles.title}>
                    <ExclamationCircleFilled className={styles.titleIcon} />
                    {__('共${sum}个库表探查发生异常', {
                        sum: detailsData?.total_count || 0,
                    })}
                </div>
                {detailsData?.details?.length ? (
                    <Collapse
                        defaultActiveKey={[0]}
                        className={styles.collapseBox}
                    >
                        {detailsData?.details?.map((item, index) => {
                            const curViewInfo = item.view_info.filter(
                                (it, ind) =>
                                    ind <
                                    (pannelOffset?.[index] || 1) * pageSize,
                            )
                            return (
                                <Panel
                                    header={
                                        <div className={styles.panelHeader}>
                                            <span>{__('错误原因：')}</span>
                                            <span
                                                title={item.exception_desc}
                                                className={styles.headerText}
                                            >
                                                {item.exception_desc}
                                            </span>
                                            <span className={styles.headerSum}>
                                                （{item?.view_info?.length || 1}
                                                ）
                                            </span>
                                        </div>
                                    }
                                    key={index}
                                >
                                    {curViewInfo?.map((it, ind) => {
                                        return (
                                            <div
                                                key={ind}
                                                className={styles.panelContent}
                                            >
                                                <DatasheetViewColored
                                                    className={styles.itemIcon}
                                                />
                                                {it.view_tech_name}
                                                <div
                                                    className={styles.panelDesc}
                                                >
                                                    {it.reason}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    {curViewInfo.length <
                                        item.view_info.length && (
                                        <div className={styles.panelBtn}>
                                            <span
                                                onClick={() => {
                                                    setPanelOffset({
                                                        ...pannelOffset,
                                                        [index]:
                                                            pannelOffset[
                                                                index
                                                            ] + 1,
                                                    })
                                                }}
                                                className={styles.btn}
                                            >
                                                {__('加载更多')}
                                            </span>
                                        </div>
                                    )}
                                </Panel>
                            )
                        })}
                    </Collapse>
                ) : (
                    <div className={styles.panelHeader}>
                        <span>{__('错误原因：')}</span>
                        <span
                            title={detailsData?.description}
                            className={styles.headerText}
                        >
                            {detailsData?.description}
                        </span>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default ExplorationErrorDetails
