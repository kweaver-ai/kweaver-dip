import { useEffect, useRef, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import ResourcesAnchor from './ResourcesAnchor'
import { useQuery } from '@/utils'
import { ResTypeEnum, requestJson } from '../const'
import { resourceReportDetailsInfo } from '../helper'
import { LabelTitle } from '../BaseInfo'
import { DetailsLabel } from '@/ui'
import InfoItemEditTable from './InfoItemEditTable'
import JsonPreView from './JsonPreView'
import ApiEditTable from './ApiEditTable'

interface IReportDetails {
    resType?: ResTypeEnum
}

const ReportDetails = (props: IReportDetails) => {
    const { resType } = props
    const query = useQuery()
    // 列表目录id--不能为空
    const resourceId = query.get('catlgId')
    const resourceType: ResTypeEnum = query.get('resType')
        ? Number(query.get('resType'))
        : resType || 1
    const contentRef = useRef<HTMLDivElement>(null)
    const [resourceReportDetailsData, setResourceReportDetailsData] = useState<
        any[]
    >(resourceReportDetailsInfo)

    const [infoItemTableData, setInfoItemTableData] = useState<any[]>([
        {
            business_name: '业务名称',
            technical_name: 'technical_name',
            data_type: 'char',
            info_business_name: '信息项业务名称',
            info_technical_name: 'technical_name',
            info_data_type: 'number',
            data_length: '20',
            shared_type: 1,
            info_item_level: 1,
            app_system_type: '01',
            app_system: 'sjjgcd01',
            open_type: 1,
            ranges: '值域',
            id: '1',
        },
        {
            business_name: '业务名称',
            technical_name: 'technical_name',
            data_type: 'char',
            info_business_name: '信息项业务名称',
            info_technical_name: 'technical_name',
            info_data_type: 'number',
            data_length: '20',
            shared_type: 3,
            info_item_level: 2,
            app_system_type: '02',
            app_system: 'sjjgcd02',
            open_type: 1,
            ranges: '值域',
            id: '2',
        },
        {
            business_name: '业务名称',
            technical_name: 'technical_name',
            data_type: 'char',
            info_business_name: '信息项业务名称',
            info_technical_name: 'technical_name',
            info_data_type: 'number',
            data_length: '20',
            info_item_level: 3,
            app_system_type: '03',
            app_system: 'sjjgcd03',
            shared_type: 2,
            open_type: 2,
            ranges: '值域',
            id: '3',
        },
    ])
    const [apiTableData, setApiTableData] = useState<any[]>([
        {
            name: 'technical_nametechnical_name',
            data_type: 'char',
            lxgs: 'integer',
            sfsz: 1,
            sfbc: 1,
            description:
                '信息项业务名称信息项业务名称信息项业务名称信息项业务名称',
            id: '1',
        },
        {
            name: 'technical_nametechnical_name',
            data_type: 'char',
            lxgs: 'number',
            sfsz: 0,
            sfbc: 0,
            description:
                '信息项业务名称信息项业务名称信息项业务名称信息项业务名称',
            id: '2',
        },
        {
            name: 'technical_nametechnical_name',
            data_type: 'char',
            lxgs: 'string',
            sfsz: 1,
            sfbc: 1,
            description:
                '信息项业务名称信息项业务名称信息项业务名称信息项业务名称',
            id: '3',
        },
    ])

    return (
        <div className={styles.deatilWrapper}>
            <div className={styles.detailsInfo} ref={contentRef}>
                {resourceReportDetailsData?.map((item) => {
                    return (
                        <div key={item.key} id={item.key}>
                            <LabelTitle label={item.label} />
                            <DetailsLabel
                                wordBreak
                                labelWidth="140px"
                                detailsList={item.list?.map((it) => ({
                                    ...it,
                                    span: it.key === 'desc' ? 24 : 12,
                                }))}
                            />
                            {resourceType === ResTypeEnum.API &&
                                item.key === 'resource' && (
                                    <div>
                                        <div id="requestBody">
                                            <div className={styles.title}>
                                                {__('请求body')}
                                            </div>
                                            <ApiEditTable
                                                value={apiTableData}
                                                onChange={(o) =>
                                                    setApiTableData(o)
                                                }
                                                columnKeys={[
                                                    'name',
                                                    'lxgs',
                                                    'sfsz',
                                                    'sfbc',
                                                    'description',
                                                ]}
                                            />
                                            <div className={styles.title}>
                                                {__('请求示例')}
                                            </div>
                                            <JsonPreView
                                                value={JSON.stringify(
                                                    requestJson,
                                                )}
                                            />
                                        </div>
                                        <div id="responseBody">
                                            <div className={styles.title}>
                                                {__('响应参数')}
                                            </div>
                                            <ApiEditTable
                                                value={apiTableData}
                                                onChange={(o) =>
                                                    setApiTableData(o)
                                                }
                                                columnKeys={[
                                                    'name',
                                                    'lxgs',
                                                    'sfsz',
                                                    'sfynr',
                                                    'description',
                                                ]}
                                            />
                                            <div className={styles.title}>
                                                {__('返回示例')}
                                            </div>
                                            <JsonPreView
                                                value={JSON.stringify(
                                                    requestJson,
                                                )}
                                            />
                                        </div>
                                    </div>
                                )}
                        </div>
                    )
                })}
                {resourceType === ResTypeEnum.TABLE && (
                    <div id="info">
                        <div style={{ marginTop: '16px' }}>
                            <LabelTitle label={__('上报信息项信息')} />
                        </div>
                        <div className={styles.title}>{__('信息项')}</div>
                        <InfoItemEditTable showMore value={infoItemTableData} />
                    </div>
                )}
            </div>
            <ResourcesAnchor type={resourceType} contentRef={contentRef} />
        </div>
    )
}
export default ReportDetails
