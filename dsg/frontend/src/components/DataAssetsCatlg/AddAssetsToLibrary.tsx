import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
    Button,
    Dropdown,
    Form,
    MenuProps,
    message,
    Space,
    Tooltip,
} from 'antd'
import { noop } from 'lodash'
import {
    CaretDownOutlined,
    CaretUpOutlined,
    InfoCircleFilled,
} from '@ant-design/icons'
import classnames from 'classnames'
import {
    DownloadAccess,
    IDataRescItem,
    addRepositorys,
    formatError,
    getRepositoryIsOnline,
} from '@/core'
import actionType from '@/redux/actionType'
import styles from './styles.module.less'
import __ from './locale'
import { BusinObjOpr } from './const'

import DataDownloadConfig from './DataDownloadConfig'
import ApplyDownloadPermission from './ApplyDownloadPermission'
import { RescErrorCodeList } from './helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IAddOrCancelAssetsIcon {
    item: any
    downLoadTitleList?: Array<any>
    backUrl?: string
    customClassName?: string | undefined
    updateData: (type: BusinObjOpr) => void
    errorCallback?: (error?: any) => void
}
const AddAssetsToLibrary: React.FC<IAddOrCancelAssetsIcon> = ({
    item,
    downLoadTitleList,
    backUrl,
    customClassName,
    updateData = noop,
    errorCallback = noop,
}) => {
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()

    // 下载权限
    const downloadAccess: number = useMemo(() => {
        return item?.download_access
    }, [item])

    const dispatch = useDispatch()
    const assetsData = useSelector((state: any) => state?.dataAssetsReducer)

    const [loading, setLoading] = useState<boolean>(false)

    const [form] = Form.useForm()

    const [dropDownOpen, setDropDownOpen] = useState(false)

    // 数据申请对话框
    const [downloadOpen, setDownloadOpen] = useState(false)

    // 数据下载配置内容对话框
    const [applyDownlodeOpen, setApplyDownlodeOpen] = useState(false)

    const onApplyDownloadClose = () => {
        setApplyDownlodeOpen(false)
    }

    const handelError = (error) => {
        const { code } = error?.data || {}

        if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
            if (downloadAccess === DownloadAccess.NO) {
                setApplyDownlodeOpen(false)
            } else if (downloadAccess === DownloadAccess.Yes) {
                setDownloadOpen(false)
            }
            errorCallback(error)
        }
    }

    // 添加到申请清单
    const handleAddToAssetsLibrary = async (asset?: IDataRescItem) => {
        if (!asset?.id) return
        try {
            const res = await addRepositorys(asset?.id)
            message.success(__('添加成功'))
            dispatch({
                type: actionType.SET_DATA_ASSETS,
                payload: {
                    dataAssetIds: [...assetsData.dataAssetIds, asset?.id],
                },
            })
        } catch (error) {
            formatError(error)
            // 失效时刷新数据
            updateData(BusinObjOpr.ADDTOREQUIRELIST)
        }
    }

    // 跳转到需求申请页面
    const handleToRequirement = () => {
        const defaultUrl = `/data-assets`
        const returnUrl = backUrl || defaultUrl
        const url = `/dataService/requirement/create?resId=${
            item?.id
        }&backUrl=${encodeURIComponent(returnUrl)}`

        navigator(url)
    }

    // 立即申请
    const handleApplyNow = async (e) => {
        try {
            const res = await getRepositoryIsOnline(item?.id)
            if (res.available) {
                handleToRequirement()
            } else {
                message.error('当前目录暂不支持立即申请，请选择其他目录')
                updateData(BusinObjOpr.APPLYNOW)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const handleOprClick = (key, e) => {
        e.stopPropagation?.()
        switch (key) {
            case BusinObjOpr.DATADOWNLOAD:
                if (downloadAccess === DownloadAccess.NO) {
                    setApplyDownlodeOpen(true)
                } else if (downloadAccess === DownloadAccess.Yes) {
                    setDownloadOpen(true)
                }
                break
            case BusinObjOpr.ADDTOREQUIRELIST:
                handleAddToAssetsLibrary(item)
                break
            case BusinObjOpr.APPLYNOW:
                handleApplyNow(e)
                break
            default:
                break
        }
    }

    const hasOprAccess = useMemo(
        () =>
            checkPermission(
                [
                    { key: 'initiateDataSupplyDemand' },
                    { key: 'analysisAndImplementSupplyDemand' },
                ],
                'or',
                true,
            ),
        [checkPermission],
    )

    const items: MenuProps['items'] = [
        hasOprAccess
            ? {
                  label: (
                      <Tooltip
                          title={
                              assetsData.dataAssetIds?.includes(item?.id)
                                  ? __('已添加')
                                  : ''
                          }
                      >
                          <span
                              onClick={(e) => {
                                  if (
                                      assetsData.dataAssetIds?.includes(
                                          item?.id,
                                      )
                                  ) {
                                      e.stopPropagation()
                                  } else {
                                      handleOprClick(
                                          BusinObjOpr.ADDTOREQUIRELIST,
                                          e,
                                      )
                                  }
                              }}
                          >
                              {__('添加到需求清单')}
                          </span>
                      </Tooltip>
                  ),
                  key: BusinObjOpr.ADDTOREQUIRELIST,
                  disabled: assetsData.dataAssetIds?.includes(item?.id),
              }
            : null,
        hasOprAccess
            ? {
                  label: (
                      <span
                          onClick={(e) => {
                              //   e.stopPropagation()
                              handleOprClick(BusinObjOpr.APPLYNOW, e)
                          }}
                      >
                          {__('立即申请')}
                      </span>
                  ),
                  key: BusinObjOpr.APPLYNOW,
              }
            : null,
    ]

    return (
        <>
            <div
                className={classnames(
                    styles.assetsIconWrapper,
                    customClassName,
                )}
            >
                <Space size={8}>
                    {downloadAccess === DownloadAccess.Auditing ? (
                        <div className={styles.auditing}>
                            <InfoCircleFilled className={styles.tipIcon} />
                            {__('申请使用审核中')}
                        </div>
                    ) : (
                        <Tooltip
                            placement="bottom"
                            getPopupContainer={(n) => n}
                            className={styles.toolTip}
                            title={
                                downloadAccess === DownloadAccess.Auditing &&
                                __('权限审核中')
                            }
                        >
                            <Button
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleOprClick(BusinObjOpr.DATADOWNLOAD, e)
                                }}
                            >
                                {downloadAccess === DownloadAccess.NO
                                    ? __('申请使用')
                                    : __('数据下载')}
                            </Button>
                        </Tooltip>
                    )}
                    {items.filter((i) => i !== null).length > 0 && (
                        <Dropdown
                            menu={{
                                items,
                                onClick: (e) => {
                                    handleOprClick(e.key, e.domEvent)
                                },
                            }}
                            trigger={['click']}
                            onOpenChange={(open) => {
                                setDropDownOpen(open)
                            }}
                            className={styles.applyDropDown}
                            getPopupContainer={(n) => n}
                        >
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation()
                                }}
                            >
                                <Space>
                                    {__('需求申请')}
                                    {dropDownOpen ? (
                                        <CaretUpOutlined
                                            style={{
                                                color: '#BFBFBF',
                                            }}
                                        />
                                    ) : (
                                        <CaretDownOutlined
                                            style={{
                                                color: '#BFBFBF',
                                            }}
                                        />
                                    )}
                                </Space>
                            </Button>
                        </Dropdown>
                    )}
                </Space>
            </div>
            <ApplyDownloadPermission
                open={applyDownlodeOpen}
                onClose={onApplyDownloadClose}
                id={item?.id}
                update={updateData}
                errorCallback={handelError}
            />

            {downloadOpen && (
                <div
                    onClick={(e) => {
                        e?.stopPropagation()
                    }}
                >
                    <DataDownloadConfig
                        formViewId={item?.id}
                        open={downloadOpen}
                        onClose={() => {
                            setDownloadOpen(false)
                        }}
                        errorCallback={handelError}
                    />
                </div>
            )}
        </>
    )
}

export default AddAssetsToLibrary
