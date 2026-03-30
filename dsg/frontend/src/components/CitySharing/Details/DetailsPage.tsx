import { useEffect, useState } from 'react'
import { CommonTitle } from '@/ui'
import { analysisInfo, applyInfo, departmentInfo } from './helper'
import styles from './styles.module.less'
import ResourceTable from '../Analysis/ResourceTable'
import { formatError, getCityShareApplyDetail } from '@/core'
import { ResTypeEnum } from '../helper'
import __ from '../locale'
import CommonDetails from './CommonDetails'

interface IDetailsPage {
    applyId: string
}
const DetailsPage = ({ applyId }: IDetailsPage) => {
    const [detailsData, setDetailsData] = useState<any>({})

    const [catalogsData, setCatalogsData] = useState<any[]>([])

    useEffect(() => {
        if (applyId) {
            getDetails()
        }
    }, [applyId])

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getCityShareApplyDetail(applyId!, {
                fields: 'base,analysis,implement,feedback',
            })
            const { feasibility, conclusion, usage } =
                res.analysis || ({} as any)
            setDetailsData({
                ...res.base,
                feasibility,
                conclusion,
                usage,
                analysis: res.analysis,
                implement: res.implement,
                feedback: res.feedback,
            })
            const baseResources = res.base.resources || []
            const analysisResources = res.analysis?.resources || []
            const clgData = baseResources.map((resource) => {
                const analysisRes = analysisResources.find(
                    (item) => item.src_id === resource.id,
                )
                const {
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    id,
                    is_res_replace,
                    column_names,
                } = analysisRes || ({} as any)

                return {
                    ...resource,
                    additional_info_types,
                    is_reasonable,
                    attach_add_remark,
                    analysis_item_id: id,
                    column_names,
                    replace_res:
                        is_reasonable || !is_res_replace
                            ? undefined
                            : {
                                  res_type: ResTypeEnum.Catalog,
                                  res_id: analysisRes?.new_res_id,
                                  res_code: analysisRes?.new_res_code,
                                  res_name: analysisRes?.new_res_name,
                                  org_path: analysisRes?.org_path,
                                  apply_conf: analysisRes?.apply_conf,
                              },
                }
            })
            setCatalogsData([
                ...clgData,
                ...analysisResources
                    .filter((item) => item.is_new_res)
                    .map((item) => {
                        return {
                            ...item,
                            analysis_item_id: item.id,
                            res_id: item.new_res_id,
                            res_name: item.new_res_name,
                            res_code: item.new_res_code,
                            res_type: item.new_res_type,
                        }
                    }),
            ])
        } catch (error) {
            formatError(error)
        }
    }

    const config: any[] = [
        applyInfo,
        departmentInfo,
        analysisInfo,
        {
            key: 'implementCatalogInfo',
            title: __('申请资源清单'),
            content: [],
            render: () => (
                <div style={{ marginTop: 16 }}>
                    <ResourceTable
                        isView
                        items={catalogsData || []}
                        isImplement
                        applyId={applyId}
                        isShowOperate={false}
                    />
                </div>
            ),
        },
    ]
    return (
        <div>
            {config.map((group) => (
                <div key={group.key}>
                    <div style={{ marginBottom: 16 }}>
                        <CommonTitle title={group.title} />
                    </div>
                    <div className={styles['content-info']}>
                        {group.render ? (
                            group.render()
                        ) : (
                            <CommonDetails
                                data={
                                    group.key === 'feedbackInfo'
                                        ? detailsData.feedback
                                        : detailsData
                                }
                                configData={group.content}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default DetailsPage
