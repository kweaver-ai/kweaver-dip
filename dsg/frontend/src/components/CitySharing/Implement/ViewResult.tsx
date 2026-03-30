import { Col, Drawer, Row } from 'antd'
import { FC, useEffect, useState } from 'react'
import { CommonTitle } from '@/ui'
import __ from '../locale'
import styles from './styles.module.less'
import { ViewResultConfig } from '../helper'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { ApplyResource } from '../const'
import {
    detailServiceOverview,
    formatError,
    getDataPushScheduleList,
    getResourceDetailsByAnalysisId,
} from '@/core'
import { resourceUtilizationOptions } from '../Apply/helper'

interface ViewResultProps {
    id: string
    open: boolean
    onClose: () => void
    applyId: string
}

const ViewResult: FC<ViewResultProps> = ({ id, open, onClose, applyId }) => {
    const [dataDetail, setDataDetail] = useState<any>()
    const [dataConfig, setConfigData] = useState<any>()
    const [syncInfo, setSyncInfo] = useState<any>()
    const [resType, setResType] = useState<ApplyResource>(
        ApplyResource.Database,
    )

    useEffect(() => {
        getDetailData()
    }, [applyId, id])

    /**
     * 获取资源详情
     */
    const getDetailData = async () => {
        try {
            const res = await getResourceDetailsByAnalysisId(applyId, id)
            const detailsService = { service_path: '' }
            if (res.src_item.apply_conf.supply_type === 'api') {
                const detailsServiceRes = await detailServiceOverview(
                    res.src_item.apply_conf.api_apply_conf.data_res_id,
                )
                detailsService.service_path =
                    detailsServiceRes.service_info.backend_service_path
            }
            setDataDetail({
                res_name: res.src_item.res_name,
                res_code: res.src_item.res_code,
                org_path: res.src_item.org_path,
                shared_condition: res.src_item.shared_condition,
                supply_type: res.src_item.apply_conf?.supply_type,
                data_res_name:
                    res.src_item.apply_conf?.view_apply_conf?.data_res_name ||
                    res.src_item.apply_conf?.api_apply_conf?.data_res_name,
                area_range:
                    res.src_item.apply_conf?.view_apply_conf?.area_range,
                time_range:
                    res.src_item.apply_conf?.view_apply_conf?.time_range,
                push_frequency:
                    res.src_item.apply_conf?.view_apply_conf?.push_frequency,
                available_date_type:
                    res.src_item.apply_conf?.available_date_type,
                task_name: res?.implement.app_name,
                call_frequency:
                    res?.src_item?.apply_conf?.api_apply_conf?.call_frequency,
                ...(res.implement || {}),
                ...detailsService,
            })
            const supplyType =
                res?.src_item?.apply_conf?.supply_type || ApplyResource.Database
            setResType(supplyType as ApplyResource)
            const pushId = res.implement?.push_job_id
            if (pushId) {
                const { entries } = await getDataPushScheduleList({
                    model_uuid: pushId,
                    offset: 1,
                    limit: 1,
                    direction: 'asc',
                    sort: 'end_time',
                })
                if (entries.length) {
                    setSyncInfo(entries[0])
                }
            }
        } catch (err) {
            formatError(err)
        }
    }

    const getConfigData = (itemKey: string) => {
        switch (itemKey) {
            case 'department':
                return (
                    <span title={dataDetail?.org_path || ''}>
                        {dataDetail?.org_path}
                    </span>
                )
            case 'supply_type':
                return dataDetail?.supply_type === 'view'
                    ? __('库表交换')
                    : __('接口服务')
            case 'available_date_type':
                return resourceUtilizationOptions.find(
                    (item) => item.value === dataDetail?.available_date_type,
                )?.label
            case 'data_res_name':
                return dataDetail?.data_res_name ? (
                    <div className={styles.nameWrapper}>
                        <FontIcon
                            type={IconType.COLOREDICON}
                            name="icon-shujubiaoshitu"
                        />
                        <span>{dataDetail?.data_res_name}</span>
                    </div>
                ) : (
                    '--'
                )
            default:
                return dataDetail?.[itemKey] || '--'
        }
    }
    const getItemContent = (configs: any) => {
        const value = getConfigData(configs.key)
        return (
            <Col span={configs.span}>
                <span className={styles.labelWrapper}>{configs.label}</span>
                <span>{value || '--'}</span>
            </Col>
        )
    }

    const getFirstSyncTask = (configs: any) => {
        const value = syncInfo?.[configs.key]
        return (
            <Col span={configs.span}>
                <span className={styles.labelWrapper}>{configs.label}</span>
                <span>{value || '--'}</span>
            </Col>
        )
    }

    return (
        <Drawer
            open={open}
            width="837px"
            placement="right"
            bodyStyle={{
                display: 'flex',
                flexDirection: 'column',
            }}
            destroyOnClose
            maskClosable={false}
            mask={false}
            push={false}
            title={__('查看资源')}
            onClose={onClose}
        >
            <div className={styles.viewResultWrapper}>
                {ViewResultConfig.map((item, index) => {
                    const { label, configs, type, key } = item
                    if (!type || type?.includes(resType)) {
                        return (
                            <div key={index}>
                                <CommonTitle title={label} />
                                <div className={styles.groupContainer}>
                                    <Row gutter={[16, 16]}>
                                        {key === 'first_sync_task'
                                            ? configs?.map((it) => {
                                                  if (
                                                      !it.type ||
                                                      it.type?.includes(resType)
                                                  ) {
                                                      return getFirstSyncTask(
                                                          it,
                                                      )
                                                  }
                                                  return null
                                              })
                                            : configs?.map((it) => {
                                                  if (
                                                      !it.type ||
                                                      it.type?.includes(resType)
                                                  ) {
                                                      return getItemContent(it)
                                                  }
                                                  return null
                                              })}
                                    </Row>
                                </div>
                            </div>
                        )
                    }
                    return null
                })}
            </div>
        </Drawer>
    )
}

export default ViewResult
