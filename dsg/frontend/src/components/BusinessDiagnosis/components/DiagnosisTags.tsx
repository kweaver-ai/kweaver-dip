import { ReactNode, useEffect, useRef, useState } from 'react'
import { Tooltip } from 'antd'
import { UpOutlined, DownOutlined } from '@ant-design/icons'
import { useSize } from 'ahooks'
import classnames from 'classnames'
import styles from '../styles.module.less'
import { BusinessProcessColored } from '@/icons'
import __ from '../locale'
import { getTextWidth } from '@/components/DatasheetView/DataQuality/helper'
import { DetailsLabel } from '@/ui'
import { tagsDetailsInfo } from '../const'
import { formatError, getBusinessDomainProcessTree } from '@/core'
import Loader from '@/ui/Loader'

interface IDiagnosisTags {
    data: { id: string; name: string }[]
}
const DiagnosisTags = (params: IDiagnosisTags) => {
    const { data } = params
    const [isExpand, setIsExpand] = useState<boolean>(false)
    const [showExpand, setShowExpand] = useState<boolean>(false)
    const [loading, setLoading] = useState<boolean>(false)
    const [maxTagIndex, setMaxTagIndex] = useState<number>(0)
    const [tagsInfoData, setTagsInfoData] = useState<any>({})
    const tagContainer = useRef<HTMLDivElement>(null)
    const size = useSize(tagContainer) || {
        width: document.body.clientWidth,
        height: document.body.clientHeight,
    }

    useEffect(() => {
        if (data?.length > 0) {
            const dataTextWidList = data.map((item) => {
                // 图标、左右间距共48px，外边距12
                const otherWid = 48 + 12
                const wid = getTextWidth(item.name, 12)
                return (wid > 128 ? 128 : wid) + otherWid
            })
            let maxInd = 0
            const totalWid = dataTextWidList.reduce((cur, pre, index) => {
                if (cur < size.width - 46) {
                    maxInd = index
                }
                return cur + pre
            }, 0)
            setMaxTagIndex(maxInd)
            setShowExpand(totalWid > size.width - 46)
        }
    }, [data, size])

    const getBusinessDomain = async (item: any) => {
        try {
            const obj = {
                keyword: item.name,
                parent_id: '',
                offset: 1,
                limit: 10,
            }
            const res = await getBusinessDomainProcessTree(obj)
            const domainInfo =
                res.entries?.find((it) => it.id === item.id) || {}
            const tagsInfo = tagsDetailsInfo.map((it) => ({
                ...it,
                value:
                    it.key === 'business_system_name'
                        ? domainInfo[it.key]?.join('、') || ''
                        : domainInfo[it.key],
            }))
            if (!tagsInfoData[item.id]) {
                const list = {
                    [item.id]: tagsInfo,
                }
                setTagsInfoData({ ...tagsInfoData, ...list })
            }
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className={classnames(
                styles.tagsBox,
                data?.length > maxTagIndex &&
                    showExpand &&
                    !isExpand &&
                    styles.singleLine,
            )}
            ref={tagContainer}
        >
            {(isExpand
                ? data
                : data.filter(
                      (it, index) => index < maxTagIndex + (showExpand ? 0 : 1),
                  )
            ).map((item: any) => {
                return (
                    <Tooltip
                        key={item?.id}
                        color="white"
                        placement="bottomLeft"
                        overlayClassName="diagnosisDetailsTagsWrapper"
                        title={
                            loading ? (
                                <Loader />
                            ) : (
                                <div className={styles.detailsBox}>
                                    <DetailsLabel
                                        detailsList={
                                            tagsInfoData?.[item.id] ||
                                            tagsDetailsInfo
                                        }
                                        labelWidth="100px"
                                    />
                                </div>
                            )
                        }
                        onOpenChange={(flag) => {
                            if (flag && !tagsInfoData[item.id]) {
                                setLoading(true)
                                getBusinessDomain(item)
                            }
                        }}
                    >
                        <div className={styles.tagsItem}>
                            <BusinessProcessColored
                                className={styles.tagsIcon}
                            />
                            <span className={styles.tagsText}>
                                {item?.name}
                            </span>
                        </div>
                    </Tooltip>
                )
            })}
            {data?.length > maxTagIndex && showExpand && (
                <div
                    className={styles.expandBtn}
                    onClick={() => setIsExpand(!isExpand)}
                >
                    <span className={styles.expandText}>
                        {isExpand ? __('收起') : __('展开')}
                    </span>
                    <span>{isExpand ? <UpOutlined /> : <DownOutlined />}</span>
                </div>
            )}
        </div>
    )
}

export default DiagnosisTags
