/* eslint-disable no-param-reassign */
import { useEffect, useMemo, useState, useRef, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, Space, Button, Anchor } from 'antd'
import classnames from 'classnames'
import { LeftOutlined } from '@ant-design/icons'
import { useGetState } from 'ahooks'
import { noop } from 'lodash'
import { getActualUrl, OperateType, useQuery } from '@/utils'
import {
    formatError,
    getIndicatorDetail,
    getIndictorList,
    TaskExecutableStatus,
} from '@/core'

import styles from './styles.module.less'
import __ from './locale'
import {
    businessDetailInfo,
    manageDetailInfo,
    technologyDetailInfo,
    TabsKey,
    IndicatorDetailTabKey,
    IndicatorType,
} from './const'

import { useCatalogColumn } from '../DimensionModel/helper'
import IndicatorView from './IndicatorView'
import IndicatorConsanguinity from '../IndicatorConsanguinity'
import GlobalMenu from '../GlobalMenu'
import IndicatorDetailContent from './IndicatorDetailContent'
import IndicatorPreview from './IndicatorPreview'
import IndicatorIcons from './IndicatorIcons'
import { TaskInfoContext } from '@/context'

// 初始params
const initialQueryParams: any = {
    offset: 1,
    limit: 100,
    keyword: '',
}

interface IIndicatorDetail {
    indicatorDataId?: string
    indicatorDataType?: TabsKey
    onClose?: () => void
    onEdit?: () => void
}
// 页面路径中获取参数
function IndicatorDetail({
    indicatorDataId,
    indicatorDataType,
    onClose = noop,
    onEdit = noop,
}: IIndicatorDetail) {
    const query = useQuery()

    const IndicatorId = query.get('indicatorId') || indicatorDataId || ''
    const indicatorType =
        query.get('indicatorType') || indicatorDataType || TabsKey.ATOMS

    const navigate = useNavigate()
    const { taskInfo } = useContext(TaskInfoContext)

    const isTaskCompleted = useMemo(() => {
        return taskInfo?.taskStatus === TaskExecutableStatus.COMPLETED
    }, [taskInfo])

    const container = useRef<any>(null)
    const { Link } = Anchor
    const [tabItems, setTabItems, getTabItems] = useGetState<Array<any>>([
        {
            key: IndicatorDetailTabKey.Detail,
            label: __('指标详情'),
        },
        {
            key: IndicatorDetailTabKey.DataPreview,
            label: __('指标预览'),
        },
        {
            key: IndicatorDetailTabKey.Consanguinity,
            label: __('指标血缘'),
        },
    ])

    const [active, setActive] = useState<IndicatorDetailTabKey>(
        IndicatorDetailTabKey.Detail,
    )

    const [detailData, setDetailData, getCurrentDetailData] = useGetState<any>(
        {},
    )
    const [loading, setLoading] = useState<boolean>(false)
    const [
        businessDetailContent,
        setBusinessDetailContent,
        getBusinessDetailContent,
    ] = useGetState(businessDetailInfo)
    const [
        manageDetailContent,
        setManageDetailContent,
        getManageDetailContent,
    ] = useGetState(manageDetailInfo)
    const [technologyDetailContent, setTechnologyDetailContent] = useState(
        technologyDetailInfo[indicatorType],
    )
    const [indictorList, setIndictorList, getCurrentIndictorList] = useGetState<
        Array<any>
    >([])
    const [dimensionModel, setDimensionModel, getDimensionModel] = useGetState<
        Array<any>
    >([])
    const [businessIndictorExist, setBusinessIndictorExist] =
        useState<boolean>(true)
    const [viewBusinessIndicator, setViewBusinessIndicator] =
        useState<string>('')

    const { getColumnsById } = useCatalogColumn()
    const [factFields, setFactFields, getFactFields] = useGetState<Array<any>>(
        [],
    )

    useEffect(() => {
        getIndictorDetails(IndicatorId)
    }, [IndicatorId])

    const getIndictorDetails = async (id: string) => {
        try {
            setLoading(true)
            const indictorData: any = await getIndicatorDetail(id)
            setDetailData(indictorData)

            if (indictorData.indicator_type === TabsKey.RECOMBINATION) {
                const { entries } = await getIndictorList(initialQueryParams)
                setIndictorList(entries)
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }

    const handleTabsChange = (key: string) => {
        setActive(key as IndicatorDetailTabKey)
    }

    const handleReturn = () => {
        // returnCallback()
        // const backUrl = `/business/indicatorManage`
        // window.open(getActualUrl(backUrl), '_self')
        onClose()
    }

    // 之前的弹框
    // 查看指标详情
    const [viewDetailId, setViewDetailId] = useState<string>('')
    const handleTurnPage = (key: string) => {
        const currentDetailData = getCurrentDetailData()
        let url = ''
        // 查看库表详情
        if (key === 'refer_view_name') {
            // const fromLink = encodeURIComponent(
            //     window.location.pathname + window.location.search,
            // )
            url = `/datasheet-view/detail?id=${currentDetailData?.refer_view_id}&model=view&backPrev=true`
            // window.open(getActualUrl(url), '_blank')
            navigate(getActualUrl(url))
        } else if (key === 'atomic_indicator_name') {
            setViewDetailId(currentDetailData.atomic_indicator_id)
        } else if (key === 'edit') {
            const id = currentDetailData.id ? currentDetailData.id : IndicatorId
            const type = currentDetailData.indicator_type
                ? currentDetailData.indicator_type
                : indicatorType

            if (type === TabsKey.RECOMBINATION) {
                url = `/business/indicatorManage?indicatorId=${id}&indicatorType=${type}&operation=${OperateType.EDIT}`
                // window.open(getActualUrl(url), '_blank')
            } else {
                url = `/business/indicatorManage/indicatorGraph?type=${
                    type === TabsKey.ATOMS
                        ? IndicatorType.ATOM
                        : IndicatorType.DERIVED
                }&operate=${OperateType.EDIT}&indicatorId=${id}&sceneId=${
                    currentDetailData?.scene_analysis_id
                }&backPrev=true`
            }
            navigate(url)
        }
    }

    /**
     * 跳转到指定页面
     *
     * 该函数使用React Router的useNavigate钩子，实现页面跳转功能
     *
     * @param url 要跳转的页面URL
     */
    const navigateJumpToPage = (url) => {
        navigate(url)
    }

    return (
        <div className={classnames(styles.detailWrapper)}>
            <div className={styles.detialTitle}>
                <Space className={styles.returnWrappper} size={12}>
                    <div className={styles.returnInfo}>
                        <GlobalMenu />
                        <div onClick={handleReturn}>
                            <LeftOutlined className={styles.returnArrow} />
                            <span className={styles.returnText}>返回</span>
                        </div>
                    </div>
                    <div className={styles.divider} />
                    <div className={styles.titleIcon}>
                        <IndicatorIcons type={indicatorType} fontSize={20} />
                    </div>
                    <div className={styles.titleText} title={detailData.name}>
                        {detailData.name}
                    </div>
                </Space>
                <div className={styles.tabWrapper}>
                    <Tabs
                        defaultActiveKey="detail"
                        onChange={handleTabsChange}
                        items={tabItems}
                    />
                </div>
                <div className={styles.blank}>
                    {!isTaskCompleted && (
                        <Button
                            type="primary"
                            onClick={() => {
                                handleTurnPage('edit')
                            }}
                            style={{ marginRight: '16px' }}
                        >
                            {__('编辑指标')}
                        </Button>
                    )}
                </div>
            </div>
            {active === IndicatorDetailTabKey.Consanguinity && (
                <div
                    style={{
                        height: 'calc(100vh - 52px)',
                        position: 'relative',
                    }}
                >
                    <IndicatorConsanguinity id={IndicatorId} />
                </div>
            )}
            {active === IndicatorDetailTabKey.Detail && (
                <div
                    style={{
                        padding: '12px 0',
                        position: 'relative',
                        height: 'calc(100vh - 52px)',
                    }}
                >
                    <IndicatorDetailContent
                        indicatorId={IndicatorId}
                        indicatorType={indicatorType}
                        onEdit={onEdit}
                        navigateJumpToPage={navigateJumpToPage}
                    />
                </div>
            )}
            {active === IndicatorDetailTabKey.DataPreview && (
                <div
                    style={{
                        position: 'relative',
                        height: 'calc(100vh - 52px)',
                    }}
                >
                    <IndicatorPreview indicatorId={IndicatorId} />
                </div>
            )}

            {viewDetailId && (
                <IndicatorView
                    onClose={() => {
                        setViewDetailId('')
                    }}
                    mask
                    style={{ position: 'absolute', top: 0 }}
                    IndicatorId={viewDetailId}
                    type={TabsKey.ATOMS}
                />
            )}
        </div>
    )
}

export default IndicatorDetail
