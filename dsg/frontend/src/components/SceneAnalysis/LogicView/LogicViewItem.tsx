import * as React from 'react'
import { memo, useState, useRef } from 'react'
import { Tooltip, Space, message } from 'antd'
import moment from 'moment'
import classnames from 'classnames'
import { useDispatch, useSelector } from 'react-redux'
import { useGetState } from 'ahooks'
import {
    DepartmentOutlined,
    DatasheetViewColored,
    InterfaceOutlined,
    ThemeOutlined,
    FontIcon,
} from '@/icons'
import { AssetType } from '../AiSearchProvider/const'
import styles from './styles.module.less'
import __ from '../AiSearchProvider/locale'
import actionType from '@/redux/actionType'
import local from '@/components/SceneAnalysis/locale'
import { messageError } from '@/core'
import { IconType } from '@/icons/const'
import DataDetail from '../DataDetail'

interface ILogicViewItem {
    item: any
    onStartDrag: any
    currentDndCase: any
    isCongSearch?: boolean
    // 当前项是否被选中
    isSelected?: boolean
    // 关闭详情弹窗
    onCloseDetail: () => void
    // 点击确认 申请API 弹窗
    confirmApplyApplication?: () => void
    setViewDetailOpen: (value: boolean) => void
    setSelectedCite: (item: any) => void
    onItemClick?: (asset: any, st: AssetType) => void
    isUseData: boolean
}

const LogicViewItem: React.FC<ILogicViewItem> = ({
    setSelectedCite,
    setViewDetailOpen,
    onStartDrag,
    currentDndCase,
    item,
    isCongSearch,
    onCloseDetail,
    confirmApplyApplication,
    onItemClick,
    isSelected = false,
    isUseData,
}: ILogicViewItem) => {
    const [downloadOpen, setDownloadOpen] = useState(false)

    const [authInfoOpen, setAuthInfoOpen] = useState<boolean>(false)
    const [applyOpen, setApplyOpen] = useState<boolean>(false)
    const [selectedRescId, setSelectedRescId] = useState<string>('')
    const [openStatus, setOpenStatus] = useState<boolean>(false)
    const dispatch = useDispatch()
    const payload = useSelector((state: any) => state?.dataProductReducer)
    const dataProductIds = payload.dataProductIds || []
    const agentData = useSelector((state: any) => {
        return state?.AgentManagerReducer
    })
    const [isDrag, setIsDrag, getIsDrag] = useGetState(false)

    const attr = 'id'

    const handleClickItem = (e) => {
        setIsDrag(false)
        setSelectedRescId(item?.[attr])
        setViewDetailOpen(true)
        // @ts-ignore
        setSelectedCite(item)
    }

    const handleApplyAPI = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedRescId(item?.[attr])
        setApplyOpen(true)
    }

    const handleAuthInfo = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedRescId(item?.[attr])
        setAuthInfoOpen(true)
    }

    const handleColseDetail = () => {
        setOpenStatus(false)
        // 提交申请后，更新列表状态
        onCloseDetail()
    }

    const handleConfirmApplyApplication = () => {
        confirmApplyApplication?.()
        setApplyOpen(false)
    }

    // eslint-disable-next-line
    const addRedux = (temp: any) => {
        if (temp.isAdd) return false
        const { id, resource_name = '', technical_name = '', code = '' } = temp
        const currItem = {
            id,
            view_name: `${resource_name}（${technical_name}）`,
            view_desc: code,
            view_status: '1',
        }
        const checkItems = agentData?.config?.data_views || []
        const tmp = [...checkItems, currItem]
        const dataViewsNew = tmp.reduce((acc, currentItem: any) => {
            const exists = acc.some((i: any) => i.id === currentItem.id)
            if (!exists) {
                // @ts-ignore
                acc.push(currentItem)
            }
            return acc
        }, [])
        dispatch({
            type: actionType.AGENT_MANAGE_DATA,
            payload: {
                ...agentData,
                config: { ...agentData.config, data_views: dataViewsNew },
                isUpdate: true,
            },
        })
        setTimeout(() => {
            message.info('添加成功')
        }, 1000)
    }

    return (
        <div
            className={classnames(
                styles.rescItem,
                isSelected && styles.selRescItem,
                item.available_status === '0' && styles.cite_permission,
            )}
            onClick={handleClickItem}
            onMouseDown={(e) => {
                if (item.available_status === '0') {
                    // messageError(__('请先联系Owner获取使用权限！'))
                    return
                }
                setIsDrag(true)
                // 300ms 过后认为时长按
                setTimeout(() => {
                    if (!getIsDrag()) return
                    setIsDrag(true)
                    if (isUseData || item.available_status === '0') return
                    onStartDrag(e, item, currentDndCase.current)
                }, 300)
            }}
        >
            <div
                className={classnames(
                    styles.viewItem,
                    isUseData && styles.useItemClass,
                )}
            >
                <div className={styles.nameContent}>
                    <div className={styles.leftName}>
                        <DatasheetViewColored className={styles.itemIcon} />
                        <div
                            title={item?.raw_title}
                            className={styles.name}
                            dangerouslySetInnerHTML={{
                                __html: `<span>${item?.title}</span>`,
                            }}
                        />
                    </div>
                    {item.available_status === '0' && (
                        <Tooltip
                            title={local(
                                '读取权限不足，无法直接使用，可联系数据Owner进行授权',
                            )}
                            placement="bottomLeft"
                        >
                            <i className={styles.sceneLock}>
                                <FontIcon
                                    name="icon-suoding1"
                                    type={IconType.COLOREDICON}
                                    className={styles.icon}
                                />
                            </i>
                        </Tooltip>
                    )}
                </div>
                <div
                    title={item?.raw_description || __('[暂无说明]')}
                    className={styles.description}
                    dangerouslySetInnerHTML={{
                        __html: item?.description || __('[暂无说明]'),
                    }}
                />
                <div className={styles.filedInfoWrapper}>
                    <div className={styles.fieldTitle}>
                        {item?.type === AssetType.LOGICVIEW
                            ? __('字段信息(${count}):', {
                                  count: (item?.fields?.length || 0).toString(),
                              })
                            : __('出参字段(${count}):', {
                                  count: (item?.fields?.length || 0).toString(),
                              })}
                    </div>
                    <Space size={4} className={styles.fieldTagWrapper}>
                        {item?.fields?.length
                            ? item?.fields?.slice(0, 3)?.map((fItem: any) => (
                                  <div
                                      className={styles.fieldTag}
                                      title={
                                          `${fItem?.raw_field_name_zh}${fItem?.raw_field_name_en}` ||
                                          '--'
                                      }
                                      dangerouslySetInnerHTML={{
                                          __html:
                                              `${fItem?.field_name_zh}${fItem?.field_name_en}` ||
                                              '--',
                                      }}
                                  />
                              ))
                            : '--'}
                    </Space>
                </div>
                {!isUseData && (
                    <div className={styles.otherInfo}>
                        <div>
                            {`${__('上线时间')} ${
                                item?.published_at
                                    ? moment(item?.published_at).format(
                                          'YYYY-MM-DD',
                                      )
                                    : '--'
                            }`}
                        </div>

                        <div className={styles.line} />
                        <div className={styles.itemOtherInfoWrapper}>
                            <div
                                className={styles.itemOtherInfo}
                                title={`所属主题：${
                                    item?.raw_subject_domain_path || '--'
                                }`}
                            >
                                <div className={styles.icon}>
                                    <ThemeOutlined />
                                </div>
                                <div
                                    className={styles.infoContent}
                                    dangerouslySetInnerHTML={{
                                        __html:
                                            item?.subject_domain_name || '--',
                                    }}
                                />
                            </div>
                            <div
                                className={styles.itemOtherInfo}
                                title={`所属部门：${
                                    item?.raw_department_path || '--'
                                }`}
                            >
                                <div className={styles.icon}>
                                    <DepartmentOutlined
                                        className={styles.commonIcon}
                                        style={{
                                            fontSize: 16,
                                        }}
                                    />
                                </div>
                                <div
                                    className={styles.infoContent}
                                    dangerouslySetInnerHTML={{
                                        __html: item?.department_name || '--',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {isUseData && item?.available_status === '1' && (
                <div
                    className={
                        item?.isAdd ? styles.alreadyAddBtn : styles.addBtn
                    }
                    onClick={() => addRedux(item)}
                >
                    {item?.isAdd ? '已添加' : '添加'}
                </div>
            )}
        </div>
    )
}

export default memo(LogicViewItem)
