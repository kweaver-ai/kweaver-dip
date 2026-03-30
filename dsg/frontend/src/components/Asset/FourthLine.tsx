import { memo, useEffect, useState } from 'react'
import { Tooltip, message } from 'antd'
import moment from 'moment'
import styles from './styles.module.less'
import __ from './locale'
import Icons from './Icons'
import {
    getBusinessLogicEntityTop,
    IBusinessLogicEntityTop,
    IDataRescItem,
    formatError,
} from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import DataCatlgContent from '../DataAssetsCatlg/DataCatlgContent'

const showToolTip = (title: any, value: any, iconType: string) => {
    return (
        <Tooltip
            title={
                title ? (
                    <div className={styles.unitTooltip}>
                        <div className={styles.tooltipTitle}>{title}：</div>
                        <div>{value || '--'}</div>
                    </div>
                ) : (
                    value
                )
            }
            className={styles.toolTip}
            getPopupContainer={(n) => n}
            // 超过12个字符，显示... 居中提示显示错位，需要靠左显示提示
            placement={`${value?.length > 12 ? 'bottomLeft' : 'bottom'}`}
        >
            <span className={styles.itemDetailInfo} key={title}>
                <span>
                    <Icons type={iconType} />
                    <span className={styles.itemDesc}>{value || '--'}</span>
                </span>
            </span>
        </Tooltip>
    )
}

const empty = () => {
    return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
}

const Item1 = ({ item, index, onClick }: any) => {
    return (
        <div className={styles.itemWrapper} onClick={onClick}>
            <div className={styles.left}>
                <Icons type={`${6 + index}`} />
            </div>
            <div className={styles.right}>
                <div className={styles.title} title={item.name}>
                    {item.name}
                </div>
                <div className={styles.counts}>
                    <span>
                        {__('访问量')}：{item?.preview_num ?? 0}
                    </span>
                    <span>|</span>
                    <span>
                        {__('下载申请量')}：{item?.apply_num ?? 0}
                    </span>
                </div>
                {item.description && (
                    <div className={styles.details} title={item.description}>
                        {item.description}
                    </div>
                )}
                <div className={styles.more}>
                    <span className={styles.info}>
                        {__('上线于')}{' '}
                        {moment(item.updated_at).format('YYYY-MM-DD')}
                    </span>
                    <span className={styles.info}>
                        {showToolTip(__('信息系统'), item.system_name, '12')}
                    </span>
                    <span className={styles.info}>
                        {showToolTip(__('数据源'), item.data_source_name, '13')}
                    </span>
                    <span className={styles.info}>
                        {showToolTip(__('Schema'), item.schema_name, '14')}
                    </span>
                    <span className={styles.info}>
                        {showToolTip(__('数据Owner'), item?.owner_name, '15')}
                    </span>
                    <span className={styles.info}>
                        {showToolTip(__('所属部门'), item.orgname, '17')}
                    </span>
                </div>
            </div>
        </div>
    )
}

function FourthLine() {
    const [assetApplyList, setAssetApplyList] = useState<any[]>()
    const [assetPreviewList, setAssetPreviewApplyList] = useState<any[]>()

    // 详情页抽屉的显示/隐藏
    const [detailOpen, setDetailOpen] = useState(false)
    // 点击详情对应item
    const [detailItem, setDetailItem] = useState<IDataRescItem>()

    useEffect(() => {
        getBusinessLogicEntityTopList({ dimension: 'apply_num', top_num: 5 })
        getBusinessLogicEntityTopList({ dimension: 'preview_num', top_num: 5 })
    }, [])

    const getBusinessLogicEntityTopList = async (
        params: IBusinessLogicEntityTop,
    ) => {
        try {
            const res = await getBusinessLogicEntityTop(params)
            if (res?.entries && res?.entries?.length) {
                if (params.dimension === 'apply_num') {
                    setAssetApplyList(res.entries)
                } else {
                    setAssetPreviewApplyList(res.entries)
                }
            }
        } catch (err) {
            setAssetApplyList([])
            setAssetPreviewApplyList([])
            formatError(err)
        }
    }
    return (
        <>
            <div className={styles.fourthLine}>
                <div className={styles.fourthLineItem}>
                    <div className={styles.tips}>
                        {__('数据资源访问 TOP 5')}
                    </div>
                    {assetPreviewList && assetPreviewList.length > 0
                        ? assetPreviewList.map((item, index) => {
                              return (
                                  <Item1
                                      item={item}
                                      index={index}
                                      key={index}
                                      onClick={() => {
                                          setDetailItem(item)
                                          setDetailOpen(true)
                                      }}
                                  />
                              )
                          })
                        : empty()}
                </div>
                <div className={styles.fourthLineItem}>
                    <div className={styles.tips}>
                        {__('数据资源申请 TOP 5')}
                    </div>
                    {assetApplyList && assetApplyList.length
                        ? assetApplyList.map((item, index) => {
                              return (
                                  <Item1
                                      item={item}
                                      index={index}
                                      key={index}
                                      onClick={() => {
                                          setDetailItem(item)
                                          setDetailOpen(true)
                                      }}
                                  />
                              )
                          })
                        : empty()}
                </div>
            </div>
            {detailItem && (
                <DataCatlgContent
                    open={detailOpen}
                    onClose={() => {
                        setDetailOpen(false)
                        setDetailItem(undefined)
                    }}
                    assetsId={detailItem?.id}
                    isIntroduced={false}
                />
            )}
        </>
    )
}

export default memo(FourthLine)
