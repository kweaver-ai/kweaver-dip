import { useEffect, useMemo, useRef, useState } from 'react'
import { Anchor, Descriptions, Drawer, Table } from 'antd'
import { isNumber } from 'lodash'
import moment from 'moment'
import { useAntdTable } from 'ahooks'
import { formatError, getWorkOrderDetail } from '@/core'
import Return from '../../../Return'
import {
    getOptionState,
    OrderStatusOptions,
    OrderTypeOptions,
    PriorityOptions,
} from '../../../helper'
import __ from '../locale'
import styles from './styles.module.less'
import { SearchInput } from '@/ui'
import FusionModalTable from './FusionModalTable'
import FusionOrderTaskTable from './FusionOrderTaskTable'
import { SourceTypeEnum } from '@/components/WorkOrder/WorkOrderManage/helper'
import { cronStrategyOptions, FusionType } from '../helper'
import FusionGraphView from '../viewMode/FusionGraphView'
import FusionGraphDrawer from '../viewMode/FusionGraphDrawer'
import { formatTime } from '@/utils'
import SqlViewModal from '../SqlViewModal'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'

const { Link } = Anchor
function DataFusionDetail({ id, onClose }: any) {
    const container = useRef<any>(null)
    const [detail, setDetail] = useState<any>()
    // 画布模式
    const [graphViewMode, setGraphViewMode] = useState<'edit' | 'view'>()
    // sql预览
    const [sqlViewVisible, setSqlViewVisible] = useState<boolean>(false)

    const getDetail = async () => {
        try {
            const res = await getWorkOrderDetail(id)
            setDetail(res)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetail()
        }
    }, [id])

    return (
        <Drawer
            open
            contentWrapperStyle={{
                width: '100%',
                height: '100%',
                boxShadow: 'none',
                transform: 'none',
                marginTop: 0,
            }}
            style={{
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            }}
            headerStyle={{ display: 'none' }}
            bodyStyle={{
                padding: '0 0 0 0',
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
        >
            <div className={styles.detailWrapper}>
                <div className={styles.header}>
                    <Return
                        onReturn={() => onClose(false)}
                        title={detail?.name || __('详情')}
                    />
                </div>
                <div className={styles.body}>
                    <div className={styles.detailContent} ref={container}>
                        <div className={styles.infoList}>
                            <div className={styles.moduleTitle} id="base-info">
                                <h4>{__('基本信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '86px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('工单名称')}>
                                    {detail?.name || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('工单类型')}>
                                    {OrderTypeOptions.find(
                                        (o) => o.value === detail?.type,
                                    )?.label ?? '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('责任人')}>
                                    {detail?.responsible_uname || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('优先级')}>
                                    {getOptionState(
                                        detail?.priority,
                                        PriorityOptions,
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('截止日期')}>
                                    {isNumber(detail?.finished_at) &&
                                    detail?.finished_at
                                        ? moment(
                                              detail.finished_at * 1000,
                                          ).format('YYYY-MM-DD')
                                        : '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('来源')}>
                                    {detail?.source_type === SourceTypeEnum.PLAN
                                        ? '处理计划'
                                        : detail?.source_type ===
                                          SourceTypeEnum.PROJECT
                                        ? '项目'
                                        : '无'}
                                </Descriptions.Item>
                                {detail?.source_type ===
                                    SourceTypeEnum.PLAN && (
                                    <Descriptions.Item label={__('来源计划')}>
                                        {detail?.source_name ?? '--'}
                                    </Descriptions.Item>
                                )}
                                {detail?.source_type ===
                                    SourceTypeEnum.PROJECT && (
                                    <>
                                        <Descriptions.Item
                                            label={__('来源项目')}
                                        >
                                            {detail?.source_name ?? '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={__('工单所在节点')}
                                        >
                                            {`${
                                                detail?.stage_name
                                                    ? `${detail?.stage_name}/`
                                                    : ''
                                            }${detail?.node_name || ''}` ||
                                                '--'}
                                        </Descriptions.Item>
                                    </>
                                )}
                                <Descriptions.Item label={__('工单状态')}>
                                    {getOptionState(
                                        detail?.status,
                                        OrderStatusOptions,
                                    )}
                                </Descriptions.Item>
                                {detail?.status === 'finished' && (
                                    <Descriptions.Item label={__('完成时间')}>
                                        {isNumber(detail?.updated_at) &&
                                        detail?.updated_at
                                            ? moment(detail.updated_at).format(
                                                  'YYYY-MM-DD HH:mm:ss',
                                              )
                                            : '--'}
                                    </Descriptions.Item>
                                )}

                                <Descriptions.Item
                                    label={__('工单说明')}
                                    span={2}
                                >
                                    {detail?.description || '--'}
                                </Descriptions.Item>
                                {/* <Descriptions.Item label={__('备注')} span={2}>
                                    {detail?.remark}
                                </Descriptions.Item> */}
                            </Descriptions>
                            <div
                                className={styles.moduleTitle}
                                id="fusion-model"
                            >
                                <h4>{__('融合模型')}</h4>
                                {detail?.fusion_table?.fusion_type ===
                                    FusionType.SCENE_ANALYSIS && (
                                    <span
                                        className={styles.previewSql}
                                        onClick={() => setSqlViewVisible(true)}
                                    >
                                        <FontIcon
                                            name="icon-SQL"
                                            type={IconType.COLOREDICON}
                                            className={styles.previewSqlIcon}
                                        />
                                        <span
                                            className={styles.previewSqlTitle}
                                        >
                                            {__('预览融合语句')}
                                        </span>
                                    </span>
                                )}
                            </div>
                            {detail?.fusion_table?.fusion_type ===
                            FusionType.SCENE_ANALYSIS ? (
                                <>
                                    <Descriptions
                                        column={2}
                                        labelStyle={{
                                            width: '104px',
                                            color: 'rgba(0, 0, 0, 0.45)',
                                        }}
                                    >
                                        <Descriptions.Item
                                            label={__('融合表名称')}
                                        >
                                            {detail?.fusion_table?.table_name ||
                                                '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={__('目标数据源')}
                                        >
                                            {detail?.fusion_table
                                                ?.datasource_name || '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label={__('数据库')}>
                                            {detail?.fusion_table
                                                ?.database_name || '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={__('数据库类型')}
                                        >
                                            {detail?.fusion_table
                                                ?.datasource_type_name || '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="schema">
                                            {detail?.fusion_table?.schema ||
                                                '--'}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={__('运行时间范围')}
                                        >
                                            {`${formatTime(
                                                detail?.fusion_table
                                                    ?.run_start_at,
                                            )} ~ ${formatTime(
                                                detail?.fusion_table
                                                    ?.run_end_at,
                                            )}`}
                                        </Descriptions.Item>
                                        <Descriptions.Item
                                            label={__('执行定时策略')}
                                        >
                                            {cronStrategyOptions.find(
                                                (o) =>
                                                    o.value ===
                                                    detail?.fusion_table
                                                        ?.run_cron_strategy,
                                            )?.label || '--'}
                                        </Descriptions.Item>
                                    </Descriptions>
                                    <div
                                        style={{
                                            height: 480,
                                            border: '1px solid #F6F9FB',
                                        }}
                                    >
                                        <FusionGraphView
                                            inMode="view"
                                            sceneData={detail?.fusion_table}
                                            onExpand={(val) => {
                                                setGraphViewMode('view')
                                            }}
                                            onEdit={() => {
                                                setGraphViewMode('edit')
                                            }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <FusionModalTable
                                    id={id}
                                    fusionModelData={detail?.fusion_table}
                                />
                            )}

                            <div className={styles.moduleTitle} id="order-task">
                                <h4>{__('工单任务')}</h4>
                            </div>
                            <div>
                                <FusionOrderTaskTable workOrderId={id} />
                            </div>
                            <div
                                className={styles.moduleTitle}
                                id="processing-content"
                            >
                                <h4>{__('处理说明')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '86px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item
                                    label={__('处理说明')}
                                    span={2}
                                >
                                    {detail?.processing_instructions || '--'}
                                </Descriptions.Item>
                            </Descriptions>
                            <div className={styles.moduleTitle} id="more-info">
                                <h4>{__('更多信息')}</h4>
                            </div>
                            <Descriptions
                                column={2}
                                labelStyle={{
                                    width: '86px',
                                    color: 'rgba(0, 0, 0, 0.45)',
                                }}
                            >
                                <Descriptions.Item label={__('创建人')}>
                                    {detail?.created_by || '--'}
                                </Descriptions.Item>
                                <Descriptions.Item label={__('创建时间')}>
                                    {isNumber(detail?.created_at) &&
                                    detail?.created_at
                                        ? moment(detail.created_at).format(
                                              'YYYY-MM-DD HH:mm:ss',
                                          )
                                        : '--'}
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                        <div className={styles.menuContainer}>
                            <Anchor
                                targetOffset={48}
                                getContainer={() =>
                                    (container.current as HTMLElement) || window
                                }
                                onClick={(e: any) => e.preventDefault()}
                                className={styles.anchorWrapper}
                            >
                                <Link
                                    href="#base-info"
                                    title={__('基本信息')}
                                />
                                <Link
                                    href="#fusion-model"
                                    title={__('融合模型')}
                                />
                                <Link
                                    href="#order-task"
                                    title={__('工单任务')}
                                />
                                <Link
                                    href="#processing-content"
                                    title={__('处理说明')}
                                />
                                <Link
                                    href="#more-info"
                                    title={__('更多信息')}
                                />
                            </Anchor>
                        </div>
                    </div>
                </div>
            </div>
            <FusionGraphDrawer
                viewMode={graphViewMode}
                open={!!graphViewMode}
                sceneData={detail?.fusion_table}
                onClose={() => {
                    setGraphViewMode(undefined)
                }}
                onSave={(value) => {
                    setGraphViewMode(undefined)
                }}
            />
            <SqlViewModal
                sqlViewData={detail?.fusion_table}
                open={sqlViewVisible}
                onClose={() => setSqlViewVisible(false)}
            />
        </Drawer>
    )
}

export default DataFusionDetail
