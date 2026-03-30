import React, { forwardRef, useState } from 'react'
import { Tabs, Tooltip } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import { IRescBasicInfo, ServiceType, DataCatlgTabKey } from './helper'
import DataUndsReport from './DataUndsReport'
import __ from './locale'
import DirBasicInfo from '../ResourcesDir/DirBasicInfo'
import DirColumnInfo from '../ResourcesDir/DirColumnInfo'
import { ResourceType } from '../ResourcesDir/const'
import FileInfoDetail from '../ResourcesDir/FileInfoDetail'
import ReportDetailContent from '../WorkOrder/QualityReport/ReportDetail/ReportDetailContent'
import SynthData from '../DatasheetView/DataPreview/SynthData'

/**
 * @params serviceType 数据资源页面tabKey（如：业务对象/数据目录）
 */
interface ITabs {
    ref?: any
    id: string
    serviceType: string
    // 默认显示tab页
    tabKey?: DataCatlgTabKey
    catlgCommonInfo?: IRescBasicInfo
    errorCallback?: (error?: any) => void
}

// 数据目录-目录内容tab
export const getDataCatlgContItems = (
    id: string,
    catlgCommonInfo?: any,
    errorCallback?: (error?: any) => void,
): any[] => {
    // 是否挂接库表
    const hasMountView = catlgCommonInfo?.mountInfo?.find((item) =>
        [item.resource_type, item.data_resource_type].includes(
            ResourceType.DataView,
        ),
    )
    // 是否只有文件资源
    const isFileRescType = catlgCommonInfo?.mountInfo?.every(
        (o) => o.resource_type === ResourceType.File,
    )
    // 是否挂接文件
    const hasMountFile = catlgCommonInfo?.mountInfo?.find((item) =>
        [item.resource_type, item.data_resource_type].includes(
            ResourceType.File,
        ),
    )
    const tabs = [
        {
            label: __('基本信息'),
            key: DataCatlgTabKey.ABSTRACT,
            children: (
                <div className={styles.tabContentWrapper}>
                    <DirBasicInfo catalogId={id} isMarket />
                </div>
            ),
            isShow: true,
        },
        {
            label: __('文件信息'),
            key: DataCatlgTabKey.FILEINFO,
            children: (
                <div className={styles.tabContentWrapper}>
                    <FileInfoDetail
                        isMarket
                        fileId={
                            catlgCommonInfo?.mountInfo?.find(
                                (item) =>
                                    item.resource_type === ResourceType.File,
                            )?.resource_id
                        }
                    />
                </div>
            ),
            isShow: hasMountFile,
        },
        {
            label: __('信息项'),
            key: DataCatlgTabKey.FIELDINFO,
            children: (
                <div className={styles.tabContentWrapper}>
                    <DirColumnInfo catalogId={id} isMarket showTitle />
                </div>
                // <DataCatlgTableInfo
                //     tableInfoType={DataCatlgTabKey.FIELDINFO}
                //     id={id}
                //     errorCallback={errorCallback}
                // />
            ),
            isShow: !isFileRescType,
        },
        {
            label: (
                <Tooltip title={!hasMountView && __('无样例数据')}>
                    {__('样例数据')}
                </Tooltip>
            ),
            key: DataCatlgTabKey.SAMPLTDATA,
            children: (
                // <div className={styles.tabContentWrapper}>
                //     <FieldsTable catalogId={id} isMarket showTitle />
                // </div>
                <div className={styles.sampleDataWrapper}>
                    {/* <FormViewExampleData
                        id={catlgCommonInfo.logicView?.id}
                        formViewStatus={
                            !catlgCommonInfo.logicView?.last_publish_time &&
                            catlgCommonInfo.logicView?.status !== 'delete'
                                ? 'unPublished'
                                : catlgCommonInfo.logicView?.status
                        }
                    /> */}
                    <SynthData
                        id={catlgCommonInfo.logicView?.id}
                        formViewStatus={
                            !catlgCommonInfo.logicView?.last_publish_time &&
                            catlgCommonInfo.logicView?.status !== 'delete'
                                ? 'unPublished'
                                : catlgCommonInfo.logicView?.status
                        }
                        enableRealData
                        catalogId={id}
                    />
                </div>
                // <DataCatlgTableInfo
                //     tableInfoType={DataCatlgTabKey.FIELDINFO}
                //     id={id}
                //     errorCallback={errorCallback}
                // />
            ),
            isShow: true,
            disabled: !hasMountView,
        },
        {
            label: (
                <Tooltip title={!hasMountView && __('无数据质量')}>
                    {__('数据质量')}
                </Tooltip>
            ),
            key: DataCatlgTabKey.QUALITY,
            children: (
                <div className={styles.tabContentWrapper}>
                    <ReportDetailContent
                        item={{
                            ...(catlgCommonInfo?.logicView || {}),
                            form_view_id: catlgCommonInfo?.logicView?.id,
                        }}
                        showCorrection={false} // 不显示整改按钮
                    />
                </div>
                // <DataCatlgTableInfo
                //     tableInfoType={DataCatlgTabKey.FIELDINFO}
                //     id={id}
                //     errorCallback={errorCallback}
                // />
            ),
            isShow: true,
            disabled: !hasMountView,
        },
        // {
        //     label: (
        //         <Tooltip title={!hasMountView && __('无数据血缘')}>
        //             {__('数据血缘')}
        //         </Tooltip>
        //     ),
        //     key: DataCatlgTabKey.CONSANGUINITYANALYSIS,
        //     children: (
        //         // <DataConsanguinity
        //         //     id={catlgCommonInfo?.logicView?.id || ''}
        //         //     dataServiceType={DataServiceType.DirContent}
        //         // />
        //         <ConsanguinityGraph id={catlgCommonInfo?.logicView?.id || ''} />
        //     ),
        //     isShow: true,
        //     disabled: !hasMountView,
        // },
        // {
        //     label: __('影响分析'),
        //     key: DataCatlgTabKey.IMPACTANALYSIS,
        //     children: (
        //         // <div className={styles.tabContentWrapper}>
        //         // </div>
        //         <ImpactAnalysis id={catlgCommonInfo?.logicView?.id || ''} />
        //     ),
        //     isShow: hasMountView,
        // },
        {
            label: __('理解报告'),
            key: DataCatlgTabKey.UNDSREPORT,
            // children: (
            //     <div className={styles.tabContentWrapper}>
            //         <DataCatlgReport catalogId={id} />
            //     </div>
            // ),
            children: (
                <div className={styles.tabContentWrapper}>
                    <DataUndsReport
                        id={id}
                        isMarket
                        errorCallback={errorCallback}
                    />
                </div>
            ),
            isShow: catlgCommonInfo?.comprehension_status === 2,
        },
        // {
        //     label: __('相关目录'),
        //     key: DataCatlgTabKey.RELATEDCATALOG,
        //     children: (
        //         <DataCatlgAbstract
        //             catalogId={id}
        //             isMarket
        //             relatedRescId={catlgCommonInfo?.mountInfo?.resource_id}
        //         />
        //     ),
        //     isShow:
        //         catlgCommonInfo.mountInfo?.resource_type !== ResourceType.File,
        // },
    ]
    // if (hasMountView) {
    //     tabs.push({
    //         label: __('数据预览'),
    //         key: DataCatlgTabKey.DATAPREVIEW,
    //         children: (
    //             <div
    //                 style={{
    //                     margin: '0 24px',
    //                     width: 'calc(100% - 48px)',
    //                     height: '100%',
    //                 }}
    //             >
    //                 <DataPreview
    //                     isMarket
    //                     dataViewId={catlgCommonInfo?.logicView?.id || ''}
    //                 />
    //             </div>
    //         ),
    //         isShow: true,
    //     })
    // }
    // if (catlgCommonInfo?.comprehension_status === 2) {
    //     tabs.push({
    //         label: __('理解报告'),
    //         key: DataCatlgTabKey.UNDSREPORT,
    //         children: <DataUndsReport id={id} errorCallback={errorCallback} />,
    //         isShow: true,
    //     })
    // }
    return tabs
}

const ContentTabs: React.FC<ITabs> = forwardRef(
    (
        { id, serviceType, tabKey, catlgCommonInfo = {}, errorCallback }: any,
        ref: any,
    ) => {
        const getItems = (activeTabKey: string) => {
            switch (activeTabKey) {
                case ServiceType.DATACATLG:
                case ServiceType.TECHNOLOGICALASSETS:
                case ServiceType.INDICATORASSETS:
                default:
                    return getDataCatlgContItems(
                        id,
                        catlgCommonInfo,
                        errorCallback,
                    )
            }
        }

        const items = getItems(serviceType)?.filter((tabItem) => tabItem.isShow)

        // 详情页面tabKey
        const [activeKey, setActiveKey] = useState<string>(
            tabKey || (items?.length ? items[0].key : ''),
        )

        return (
            <div
                ref={ref}
                className={classnames(
                    styles.contentTabs,
                    activeKey === DataCatlgTabKey.CONSANGUINITYANALYSIS
                        ? styles.businsConsgnityTab
                        : '',
                )}
            >
                <Tabs
                    activeKey={activeKey}
                    onChange={(e) => setActiveKey(e)}
                    getPopupContainer={(node) => node}
                    tabBarGutter={32}
                    items={items}
                    destroyInactiveTabPane
                />
            </div>
        )
    },
)

export default ContentTabs
