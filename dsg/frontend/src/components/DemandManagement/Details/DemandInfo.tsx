import moment from 'moment'
import React, { useContext, useEffect, useState } from 'react'
import { DownloadOutlined } from '@ant-design/icons'
import { AnalyserInfoFields, DemandFieldType, DemandInfoFields } from './const'
import __ from '../locale'
import styles from './styles.module.less'
import {
    IAnalysisResult,
    IDemandBaseInfo,
    downloadDemandFileV2,
    formatError,
    getDemandBaseInfoBackV2,
    getDemandBaseInfoV2,
    getDemandDetailsV2,
    getUrlByCommand,
    getToken,
    isMicroWidget,
} from '@/core'
import { streamToFile, useQuery, downloadFileBlob } from '@/utils'
import FileIcon from '../../FileIcon'
import { DemandDetailView, DemandType } from '../const'
import CommonTitle from '../CommonTitle'
import { MicroWidgetPropsContext } from '@/context'

/**
 * @param {boolean} isBack 是否后台 （前后台调用接口不一致）
 */
interface IDemandInfo {
    isShowTitle?: boolean
    details?: IDemandBaseInfo
    analyserInfo?: IAnalysisResult
}
const DemandInfo: React.FC<IDemandInfo> = ({
    isShowTitle = true,
    details,
    analyserInfo,
}) => {
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)

    const download = async (fileId: string, fileName: string) => {
        try {
            if (!fileId) return
            // const res = await downloadDemandFileV2(fileId)
            // // 将文件流转换成文件
            // streamToFile(res, fileName)
            if (isMicroWidget({ microWidgetProps })) {
                const nameArr = details?.attachment_name?.split('.') || []
                downloadFileBlob({
                    url: `/api/demand-management/v2/file/${details?.attachment_id}`,
                    fileName: nameArr[0],
                    type: nameArr[1],
                    realIp: getUrlByCommand({ microWidgetProps }),
                    token: getToken({ microWidgetProps }),
                })
            } else {
                window.open(
                    `/api/demand-management/v2/file/${details?.attachment_id}`,
                    '_blank',
                )
            }
        } catch (error) {
            formatError(error)
        }
    }

    const getValue = (field) => {
        const val: any = details?.[field.value]
        if (val) {
            if (field.type === DemandFieldType.TIME) {
                return moment(details?.[field.value]).format('YYYY-MM-DD')
            }

            if (field.type === DemandFieldType.FILE && details?.attachment_id) {
                const suffix = val.substring(val.lastIndexOf('.') + 1)
                return (
                    <div className={styles['file-container']}>
                        <FileIcon suffix={suffix} />
                        <div className={styles['file-name']} title={val}>
                            {val}
                        </div>
                        <DownloadOutlined
                            className={styles['download-icon']}
                            onClick={() => download(details.attachment_id, val)}
                        />
                    </div>
                )
            }

            if (field.value === 'dmd_type' && val === DemandType.DataApply) {
                return __('数据应用需求')
            }

            return val
        }
        return '--'
    }

    return (
        <div className={styles['demand-info-wrapper']}>
            {isShowTitle && <CommonTitle title={__('需求信息')} />}
            <div className={styles['demand-info-content']}>
                {DemandInfoFields.map((field) => (
                    <div
                        className={styles['demand-info-item']}
                        key={field.value}
                    >
                        <div className={styles['demand-info-item-label']}>
                            {field.label}
                        </div>
                        <div className={styles['demand-info-item-value']}>
                            {getValue(field)}
                        </div>
                    </div>
                ))}
                {analyserInfo &&
                    AnalyserInfoFields.map((field) => (
                        <div
                            className={styles['demand-info-item']}
                            key={field.value}
                        >
                            <div className={styles['demand-info-item-label']}>
                                {field.label}
                            </div>
                            <div className={styles['demand-info-item-value']}>
                                {analyserInfo?.[field.value] || '--'}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    )
}

export default DemandInfo
