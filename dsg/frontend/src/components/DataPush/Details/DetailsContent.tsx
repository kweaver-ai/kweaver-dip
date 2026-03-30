import React, { memo, useRef } from 'react'
import styles from './styles.module.less'
import {
    GroupHeader,
    GroupSubHeader,
    renderEmpty,
    schedulePlan,
} from '../helper'
import DataPushAnchor from './DataPushAnchor'
import DetailsGroup from './DetailsGroup'
import {
    anchorConfig,
    basicInfo,
    moreInfo,
    pushMechanism,
    sourceInfo,
    targetInfo,
} from './helper'
import __ from '../locale'
import Editor, { getFormatSql } from '@/components/IndicatorManage/Editor'
import { IDataPushDetail } from '@/core'
import PushFieldDetail from './PushFieldDetail'

interface IDetailsContent {
    detailsData?: IDataPushDetail
}

/**
 * 详情内容
 */
const DetailsContent = ({ detailsData }: IDetailsContent) => {
    const container = useRef(null)

    const configMap = {
        basicInfo: {
            config: basicInfo,
        },
        sourceInfo: {
            config: sourceInfo,
            dataMap: 'source_detail',
        },
        targetInfo: {
            config: targetInfo,
            dataMap: 'target_detail',
        },
        pushField: {
            render: (_, record) => <PushFieldDetail data={record} />,
        },
        filterCondition: {
            render: (value, record) => {
                return record.filter_condition ? (
                    <div className={styles.filterRule}>
                        <Editor
                            style={{ maxHeight: 320, overflow: 'auto' }}
                            grayBackground
                            highlightActiveLine={false}
                            value={getFormatSql(record.filter_condition)}
                            editable={false}
                            readOnly
                        />
                    </div>
                ) : (
                    '--'
                )
            },
        },
        pushMechanism: {
            config: pushMechanism,
        },
        schedulePlan: {
            config: schedulePlan,
        },
    }

    return detailsData ? (
        <>
            <div className={styles.detailsContentWrapper} ref={container}>
                <div className={styles.detailsContent}>
                    {anchorConfig.map((item) => (
                        <div key={item.key}>
                            <GroupHeader text={item.title} id={item.key} />
                            {configMap[item.key]?.config && (
                                <div className={styles.group}>
                                    <DetailsGroup
                                        config={configMap[item.key].config}
                                        data={detailsData}
                                        labelWidth="100px"
                                    />
                                </div>
                            )}
                            <div className={styles.group}>
                                {item.children &&
                                    item.children.map((child) => {
                                        const style: any =
                                            child.key === 'pushField'
                                                ? {
                                                      position: 'sticky',
                                                      top: 0,
                                                      zIndex: 1,
                                                  }
                                                : undefined
                                        return (
                                            <div key={child.key}>
                                                <GroupSubHeader
                                                    text={child.title}
                                                    id={child.key}
                                                    style={style}
                                                />
                                                {configMap[child.key]
                                                    ?.config && (
                                                    <div
                                                        className={
                                                            styles.subGroup
                                                        }
                                                    >
                                                        <DetailsGroup
                                                            config={
                                                                configMap[
                                                                    child.key
                                                                ].config
                                                            }
                                                            data={
                                                                configMap[
                                                                    child.key
                                                                ].dataMap
                                                                    ? detailsData?.[
                                                                          configMap[
                                                                              child
                                                                                  .key
                                                                          ]
                                                                              .dataMap
                                                                      ]
                                                                    : detailsData
                                                            }
                                                            labelWidth="100px"
                                                        />
                                                    </div>
                                                )}
                                                {configMap[child.key]
                                                    ?.render && (
                                                    <div
                                                        className={
                                                            styles.subRenderGroup
                                                        }
                                                    >
                                                        {configMap[
                                                            child.key
                                                        ]?.render(
                                                            detailsData?.[
                                                                child.key
                                                            ],
                                                            detailsData,
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}
                    <GroupHeader text={__('更多信息')} id="moreInfo" />
                    <div className={styles.group}>
                        <DetailsGroup
                            config={moreInfo}
                            data={detailsData}
                            labelWidth="100px"
                        />
                    </div>
                </div>
            </div>
            <DataPushAnchor container={container} />
        </>
    ) : (
        renderEmpty(64)
    )
}

export default memo(DetailsContent)
