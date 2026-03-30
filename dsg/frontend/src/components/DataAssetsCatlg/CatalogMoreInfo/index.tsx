import React, {
    forwardRef,
    ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react'
import { Tooltip, Divider, Rate, Button } from 'antd'
import moment from 'moment'
import { FontIcon, BusinessSystemOutlined, DepartmentOutlined } from '@/icons'
import styles from './styles.module.less'
import __ from '../locale'
import { getTextWidth } from '@/components/DatasheetView/DataQuality/helper'
import { getFieldTypeEelment } from '@/components/DatasheetView/helper'
import {
    formatError,
    getCategory,
    getCatlgScoreSummary,
    ICategoryItem,
} from '@/core'
import {
    resourceTypeList,
    publishStatus,
    publishStatusList,
    onLineStatus,
    onLineStatusList,
    ResTypeEnum,
    ResourceType,
} from '@/components/ResourcesDir/const'
import Score from '@/components/MyAssets/MyScore/Score'
import { catlogResourceTypeList } from '@/components/DataAssetsCatlg/helper'
import { IconType } from '@/icons/const'
import { resourceTypeIcon } from '@/components/ResourcesDir/helper'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'

interface ICatalogMoreInfo {
    infoData: any
    categorys?: any[]
    filterKeys?: string[]
    isNeedScore?: boolean
    isShowScore?: boolean
}
export const CatalogMoreInfo = (props: ICatalogMoreInfo) => {
    const {
        infoData,
        categorys,
        filterKeys = [],
        isNeedScore = false,
        isShowScore = true,
    } = props
    const itemOtherInfo: any[] = [
        {
            infoKey: 'online_at',
            type: 'timestamp',
            title: __('上线时间'),
        },
        {
            infoKey: 'data_resource_type',
            title: (
                <FontIcon
                    name="icon-leixing"
                    style={{ fontSize: 14 }}
                    className={styles.commonIcon}
                />
            ),
            toolTipTitle: `${__('资源类型')}：`,
        },
        {
            infoKey: 'subject_domain_name',
            id: '00000000-0000-0000-0000-000000000003',
            title: (
                <FontIcon
                    name="icon-suoshuzhuti"
                    style={{ fontSize: 16 }}
                    className={styles.commonIcon}
                />
            ),
            toolTipTitle: `${__('所属主题')}：`,
        },
        {
            infoKey: 'department_name',
            pathKey: 'department',
            id: '00000000-0000-0000-0000-000000000001',
            title: (
                <DepartmentOutlined
                    className={styles.commonIcon}
                    style={{ fontSize: 16 }}
                />
            ),
            toolTipTitle: `${__('所属部门')}：`,
        },
        {
            infoKey: 'system_name',
            id: '00000000-0000-0000-0000-000000000002',
            title: (
                <BusinessSystemOutlined
                    style={{ fontSize: 16 }}
                    className={styles.commonIcon}
                />
            ),
            toolTipTitle: `${__('信息系统')}：`,
        },
        {
            infoKey: 'score',
            title: __('综合评分'),
            toolTipTitle: __('综合评分 ${score} 共 ${count} 人评分', {
                score: 3.0,
                count: 10,
            }),
        },
    ]
    const [itemOtherInfoList, setItemOtherInfoList] = useState<any[]>()
    const [scoreInfo, setScoreInfo] = useState<any>({})
    const [scoreOpen, setScoreOpen] = useState(false)

    useEffect(() => {
        if (infoData?.scoreInfo) {
            setScoreInfo(infoData?.scoreInfo)
        }
    }, [infoData?.scoreInfo])

    const handleScoreOk = async () => {
        const res = await getCatlgScoreSummary([scoreInfo.catalog_id])
        setScoreInfo(res?.[0] || {})
        setScoreOpen(false)
    }

    useEffect(() => {
        if (categorys?.length) {
            getItemOtherInfoList(categorys)
        } else {
            queryCategoryList()
        }
    }, [categorys])

    // 获取类目列表
    const queryCategoryList = async (value: any = {}) => {
        try {
            const { entries } = await getCategory({})
            getItemOtherInfoList(entries)
        } catch (err) {
            formatError(err)
        }
    }

    const getItemOtherInfoList = (list: any[]) => {
        const stopCategorys = list.filter((item) => !item.using)
        setItemOtherInfoList(
            itemOtherInfo.map((it) => ({
                ...it,
                hide:
                    filterKeys.includes(it.infoKey) ||
                    (it.key === 'online_at'
                        ? !infoData?.online_at
                        : it?.id &&
                          stopCategorys?.find((o) => o.id === it?.id)) ||
                    it.infoKey === 'score',
            })),
        )
    }

    return (
        <div className={styles.itemOtherInfo}>
            {itemOtherInfoList
                ?.filter((item) => !item.hide)
                .map((oItem) => {
                    const { infoKey, title, toolTipTitle, pathKey } = oItem
                    const path = infoData?.[pathKey]?.node_path
                    const resource_type = infoData?.mount_data_resources?.find(
                        (o) => o.data_resources_type === 'data_view',
                    )
                        ? ResourceType.DataView
                        : infoData.data_resource_type
                    const showContent =
                        infoKey === 'online_at'
                            ? infoData?.[infoKey]
                                ? `${moment(infoData?.[infoKey]).format(
                                      'YYYY-MM-DD',
                                  )}`
                                : '--'
                            : infoKey === 'data_resource_type'
                            ? resourceTypeList?.find(
                                  (it) => it.value === resource_type,
                              )?.label
                            : infoData?.[infoKey]
                    let resourceTips = ''
                    if (infoKey === 'data_resource_type') {
                        resourceTips = infoData?.mount_data_resources?.map(
                            (it) =>
                                `${
                                    catlogResourceTypeList?.find(
                                        (o) =>
                                            o.value === it.data_resources_type,
                                    )?.label
                                } ${it.data_resources_ids?.length} `,
                        )
                    }
                    return (
                        <Tooltip
                            title={
                                showContent ? (
                                    <div className={styles.unitTooltip}>
                                        <div>
                                            {resourceTips ? '' : toolTipTitle}
                                        </div>
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html:
                                                    path ||
                                                    resourceTips ||
                                                    showContent ||
                                                    '--',
                                            }}
                                        />
                                    </div>
                                ) : (
                                    ''
                                )
                            }
                            className={styles.toolTip}
                            getPopupContainer={(n) => n}
                            placement="bottom"
                        >
                            <div
                                className={styles.itemDetailInfo}
                                key={infoKey}
                                style={
                                    infoKey === 'online_at'
                                        ? { flex: 'none' }
                                        : {
                                              maxWidth: `calc(100% / ${
                                                  itemOtherInfoList?.length || 1
                                              })`,
                                          }
                                }
                            >
                                <span>{title}</span>
                                <span
                                    className={styles.itemDetailInfoValue}
                                    dangerouslySetInnerHTML={{
                                        __html: showContent || '--',
                                    }}
                                />
                                {(infoKey === 'published_at' ||
                                    (infoKey === 'system_name' &&
                                        isShowScore)) && (
                                    <Divider
                                        style={{
                                            height: '12px',
                                            borderRadius: '1px',
                                            borderLeft:
                                                '1px solid rgba(0,0,0,0.24)',
                                            margin: '0px 2px 0px 12px',
                                        }}
                                        type="vertical"
                                    />
                                )}
                            </div>
                        </Tooltip>
                    )
                })}
            {isShowScore && (
                <div
                    className={
                        isNeedScore
                            ? styles.scoreContainer
                            : styles.showScoreContainer
                    }
                >
                    <Tooltip
                        title={
                            isNeedScore
                                ? ''
                                : __('综合评分 ${score} 共 ${count} 人评分', {
                                      score: scoreInfo?.average_score || '0',
                                      count: scoreInfo?.count || '0',
                                  })
                        }
                        getPopupContainer={(n) => n}
                        placement="bottom"
                    >
                        <div>{__('综合评分')}</div>
                    </Tooltip>
                    {isNeedScore ? (
                        <>
                            <Rate
                                value={scoreInfo?.average_score || 0}
                                disabled
                            />
                            <span className={styles.scoreText}>
                                {scoreInfo?.average_score || 0} &nbsp;
                                {__('共${count}人评分', {
                                    count: scoreInfo?.count || '0',
                                })}
                            </span>
                            {scoreInfo?.has_scored ? (
                                <span className={styles.scoredText}>
                                    {__('已评价')}
                                </span>
                            ) : (
                                <Button
                                    type="link"
                                    onClick={() => setScoreOpen(true)}
                                >
                                    {__('我要评分')}
                                </Button>
                            )}
                        </>
                    ) : (
                        <Rate value={scoreInfo.average_score || 0} disabled />
                    )}
                </div>
            )}
            {scoreOpen && (
                <Score
                    catlgItem={{ ...(scoreInfo || {}) }}
                    open={scoreOpen}
                    onCancel={() => setScoreOpen(false)}
                    onOk={handleScoreOk}
                    isFirstScore
                />
            )}
        </div>
    )
}

interface IInfoItem {
    name: string
    code?: any
    id?: string
    // 后端返回带标签颜色字段
    rowName?: any
    rowCode?: any
}
interface ICatalogInfoItems {
    label?: string
    dataList: IInfoItem[]
    itemSum?: number
    itemWidth?: string
}
export const CatalogInfoItems = (props: ICatalogInfoItems) => {
    const {
        label = __('信息项'),
        dataList = [],
        itemSum = 4,
        itemWidth,
    } = props

    const labelWidth: number = useMemo(() => {
        return getTextWidth(label || '') + 20
    }, [label])

    const count: number = useMemo(() => {
        return dataList.length - itemSum
    }, [dataList])

    const list = useMemo(() => {
        return dataList.slice(0, 4)
    }, [dataList])

    return (
        <div className={styles.infoItemWrapper}>
            <div className={styles.label}>{label}：</div>
            <div
                className={styles.right}
                // style={{ width: `calc(100% - ${labelWidth}px)` }}
            >
                <div
                    className={styles.infoItemBox}
                    style={itemWidth ? { width: `100%` } : {}}
                >
                    {list?.length === 0
                        ? '--'
                        : list.map((item, index) => {
                              return (
                                  <Tooltip
                                      key={index}
                                      title={
                                          <div>
                                              <div>
                                                  <span>
                                                      {__('业务名称：')}
                                                  </span>
                                                  <span
                                                      dangerouslySetInnerHTML={{
                                                          __html:
                                                              item?.rowName ||
                                                              '--',
                                                      }}
                                                  />
                                              </div>
                                              {item?.rowCode && (
                                                  <div>
                                                      <span>
                                                          {__('技术名称：')}
                                                      </span>
                                                      <span
                                                          dangerouslySetInnerHTML={{
                                                              __html:
                                                                  item?.rowCode ||
                                                                  '--',
                                                          }}
                                                      />
                                                  </div>
                                              )}
                                          </div>
                                      }
                                      color="#fff"
                                      overlayStyle={{
                                          maxWidth: '1000px',
                                      }}
                                      overlayInnerStyle={{
                                          color: 'rgba(0,0,0,0.85)',
                                      }}
                                  >
                                      <div
                                          key={index}
                                          title={item?.name}
                                          className={styles.item}
                                          style={{
                                              maxWidth: itemWidth || '256px',
                                          }}
                                          //   dangerouslySetInnerHTML={{
                                          //       __html:
                                          //           ,
                                          //   }}
                                      >
                                          {item.code === item.rowCode ? (
                                              <span
                                                  dangerouslySetInnerHTML={{
                                                      __html:
                                                          item?.rowName || '--',
                                                  }}
                                              />
                                          ) : (
                                              <>
                                                  <span
                                                      dangerouslySetInnerHTML={{
                                                          __html:
                                                              item?.rowName ||
                                                              '--',
                                                      }}
                                                  />
                                                  <span
                                                      style={{
                                                          padding: '0 4px',
                                                      }}
                                                  >
                                                      |
                                                  </span>
                                                  <span
                                                      dangerouslySetInnerHTML={{
                                                          __html:
                                                              item?.rowCode ||
                                                              '--',
                                                      }}
                                                  />
                                              </>
                                          )}
                                      </div>
                                  </Tooltip>
                              )
                          })}
                </div>
                {count > 0 && <div className={styles.item}>{`+${count}`}</div>}
            </div>
        </div>
    )
}

interface ICatalogInfoItemDetails {
    name: string
    code: string
    dataType: string
    isPrimary?: boolean
}
export const CatalogInfoItemDetails = (props: {
    dataList: ICatalogInfoItemDetails
}) => {
    const { dataList } = props

    return (
        <div className={styles.infoItemDetailsWrapper}>
            <div className={styles.firstLine}>
                <span className={styles.line} />
                <span className={styles.icon}>
                    {getFieldTypeEelment({ type: dataList?.dataType }, 16)}
                </span>
                <span className={styles.name} title={dataList?.name}>
                    {dataList?.name || '--'}
                </span>
                {dataList?.isPrimary && (
                    <span className={styles.primary}>{__('主键')}</span>
                )}
            </div>
            <div className={styles.secondLine} title={dataList?.code}>
                {dataList?.code}
            </div>
            {/* <div className={styles.thirdLine}>
                <CatalogInfoItems
                    itemWidth="30%"
                    label={__('样例数据')}
                    dataList={[
                        { name: '样例数据1' },
                        { name: '样例数据2' },
                        { name: '样例数据3' },
                    ]}
                />
            </div> */}
        </div>
    )
}
interface ICatalogMountResource {
    name: string
    code: string
    resource_type: number
}
export const CatalogMountResource = (props: {
    resourceList: ICatalogMountResource[]
    onResourceClick: (item: ICatalogMountResource) => void
}) => {
    const { resourceList, onResourceClick } = props

    return (
        <div className={styles.catalogMountResourceWrapper}>
            {resourceList?.length ? (
                resourceList?.map((item, index) => {
                    return (
                        <div className={styles.item} key={index}>
                            <div className={styles.icon}>
                                {resourceTypeIcon(item?.resource_type)}
                            </div>
                            <div className={styles.nameBox}>
                                <div
                                    className={styles.name}
                                    // onClick={() => onResourceClick(item)}
                                    title={item?.name}
                                >
                                    {item?.name || '--'}
                                </div>
                                <div className={styles.code} title={item?.code}>
                                    {item?.code}
                                </div>
                            </div>
                        </div>
                    )
                })
            ) : (
                <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
            )}
        </div>
    )
}

export const PublishStatusTag = (props: {
    status: publishStatus
    isFull?: boolean
}) => {
    const { status, isFull } = props
    const text =
        status === publishStatus.Published ? __('已发布') : __('未发布')
    // const title = `${text}（${
    //     publishStatusList.find((item) => item.value === status)?.label ||
    //     __('未发布')
    // }）`
    return (
        <div className={styles.tagWrapper}>
            {/* <Tooltip
                title={isFull ? '' : title}
                placement="bottom"
                color="#fff"
                overlayInnerStyle={{
                    color: 'rgba(0,0,0,0.85)',
                }}
            > */}
            <div className={styles.tag}>{text}</div>
            {/* </Tooltip> */}
        </div>
    )
}
export const OnlineStatusTag = (props: {
    status: onLineStatus
    isFull?: boolean
}) => {
    const { status, isFull } = props
    const text =
        status === onLineStatus.Online || status === onLineStatus.OfflineReject
            ? __('已上线')
            : __('未上线')
    // const title = `${text}（${
    //     onLineStatusList.find((item) => item.value === status)?.label ||
    //     __('未上线')
    // }）`
    return (
        <div className={styles.tagWrapper}>
            {/* <Tooltip
                title={isFull ? '' : title}
                placement="bottom"
                color="#fff"
                overlayInnerStyle={{
                    color: 'rgba(0,0,0,0.85)',
                }}
            > */}
            <div className={styles.tag}>{text}</div>
            {/* </Tooltip> */}
        </div>
    )
}
