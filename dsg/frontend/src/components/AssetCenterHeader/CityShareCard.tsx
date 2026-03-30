import React, { useState, useEffect } from 'react'
import { Button, Checkbox, Popover, Spin, Tooltip } from 'antd'
import { useSelector, useDispatch } from 'react-redux'
import classnames from 'classnames'
import { ExclamationCircleFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { Empty, SearchInput } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import actionType from '@/redux/actionType'
import {
    deleteApplicationCatalog,
    formatError,
    getApplicationCatalog,
    IApplicationCatalogItem,
    ShareApplyResourceTypeEnum,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { IconType } from '@/icons/const'

interface IResourceItem {
    resourceData: IApplicationCatalogItem
    checked: boolean
    onChange: (checked: boolean) => void
    onRemove: () => void
}

const ResourceItem: React.FC<IResourceItem> = ({
    resourceData,
    checked,
    onChange,
    onRemove,
}) => {
    const isDisabled = !resourceData?.is_online

    return (
        <div
            className={classnames(styles.resourceItem, {
                [styles.checked]: checked,
                [styles.disabled]: isDisabled,
            })}
        >
            <Checkbox
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={isDisabled}
            >
                <div className={styles.resourceContent}>
                    {/* <AppDataContentColored className={styles.resourceIcon} /> */}
                    <FontIcon
                        name={
                            resourceData.res_type ===
                            ShareApplyResourceTypeEnum.Api
                                ? 'icon-jiekoufuwuguanli'
                                : 'icon-shujumuluguanli1'
                        }
                        type={IconType.COLOREDICON}
                        className={styles.resourceIcon}
                    />
                    <div className={styles.resourceNameWrap}>
                        <span
                            className={styles.resourceName}
                            title={resourceData?.res_name}
                        >
                            {resourceData?.res_name}
                        </span>
                        <span
                            className={styles.resourceCode}
                            title={resourceData?.res_description}
                        >
                            {__('描述：')}
                            {resourceData?.res_description}
                        </span>
                    </div>
                </div>
            </Checkbox>
            {isDisabled ? (
                <Tooltip
                    title={
                        <span>
                            {__('目录已下线，')}
                            <a onClick={() => onRemove()}>
                                {__('移出待共享申请清单')}
                            </a>
                        </span>
                    }
                    placement="bottomRight"
                    arrowPointAtCenter
                    color="#fff"
                    overlayInnerStyle={{
                        color: 'rgb(0, 0, 0, 0.85)',
                    }}
                >
                    <ExclamationCircleFilled className={styles.disabledIcon} />
                </Tooltip>
            ) : (
                <a onClick={() => onRemove()} className={styles.removeBtn}>
                    {__('移出')}
                </a>
            )}
        </div>
    )
}

interface ICityShareMenu {
    children?: React.ReactNode
    inCogAsst?: boolean // 是否在认知助手中
}

const CityShareCard: React.FC<ICityShareMenu> = ({
    children,
    inCogAsst = false,
}) => {
    const dispatch = useDispatch()
    const citySharingData = useSelector(
        (state: any) => state?.citySharingReducer,
    )
    const navigator = useNavigate()
    const [userInfo] = useCurrentUser()

    const [loading, setLoading] = useState(false)

    // 是否不再提醒
    const [isRemind, setIsRemind] = useState(true)
    // 选中的资源
    const [selectedItems, setSelectedItems] = useState<
        IApplicationCatalogItem[]
    >([])
    // 显示的目录列表
    const [catalogList, setCatalogList] = useState<IApplicationCatalogItem[]>(
        [],
    )

    useEffect(() => {
        getCitySharingData()
        if (
            localStorage.getItem('af_cityShareTip') === null ||
            !JSON.parse(localStorage.getItem('af_cityShareTip') || '')?.[
                userInfo?.ID
            ]
        ) {
            setIsRemind(false)
        }
    }, [])

    useEffect(() => {
        setSelectedItems([])
        const open = inCogAsst
            ? citySharingData?.inCogAsstOpen
            : citySharingData?.open
        if (open) {
            getCitySharingData()
        }
    }, [citySharingData?.open, citySharingData?.inCogAsstOpen])

    // 不再提醒
    const handleRemind = () => {
        setIsRemind(true)
        if (localStorage.getItem('af_cityShareTip') === null) {
            localStorage.setItem(
                'af_cityShareTip',
                JSON.stringify({
                    [userInfo.ID]: true,
                }),
            )
        } else {
            localStorage.setItem(
                'af_cityShareTip',
                JSON.stringify({
                    ...JSON.parse(
                        localStorage.getItem('af_cityShareTip') || '',
                    ),
                    [userInfo.ID]: true,
                }),
            )
        }
    }

    // 获取市州待共享数据
    const getCitySharingData = async () => {
        try {
            setLoading(true)
            const res = await getApplicationCatalog()
            setCatalogList(res || [])
            dispatch({
                type: actionType.CITY_SHARING,
                payload: {
                    data: res || [],
                },
            })
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    // 单选
    const handleCheckboxChange = (item: any, checked: boolean) => {
        setSelectedItems((prev) =>
            checked
                ? [...prev, item]
                : prev.filter((i) => i.res_id !== item.res_id),
        )
    }

    // 全选
    const handleSelectAll = (checked: boolean) => {
        setSelectedItems(
            checked ? catalogList?.filter((item: any) => item.is_online) : [],
        )
    }

    // 移除
    const handleRemove = async (item: any) => {
        setSelectedItems((prev) => prev.filter((i) => i.res_id !== item.res_id))
        try {
            await deleteApplicationCatalog(item.res_id)
            setCatalogList((prev) =>
                prev.filter((cityItem) => cityItem.res_id !== item.res_id),
            )
            dispatch({
                type: actionType.CITY_SHARING,
                payload: {
                    ...citySharingData,
                    data: citySharingData?.data?.filter(
                        (cityItem) => cityItem.res_id !== item.res_id,
                    ),
                },
            })
        } catch (error) {
            formatError(error)
        }
    }

    const getContent = () => (
        <div className={styles.cityShareMenu}>
            <div className={styles.menuHeader}>
                {__('待共享申请清单 ${num}', {
                    num: loading ? '' : `${citySharingData?.data?.length}`,
                })}
            </div>
            {loading ? (
                <div className={styles.loading}>
                    <Spin />
                </div>
            ) : citySharingData?.data?.length === 0 ? (
                <Empty
                    desc={__('暂无数据')}
                    iconSrc={dataEmpty}
                    style={{ marginBottom: 24 }}
                />
            ) : (
                <>
                    <SearchInput
                        placeholder={__('数据目录名称')}
                        className={styles.search}
                        onKeyChange={(kw: string) => {
                            setCatalogList(
                                citySharingData?.data?.filter((item: any) =>
                                    item.res_name
                                        .toLowerCase()
                                        .includes(kw.toLowerCase()),
                                ),
                            )
                        }}
                    />
                    <div className={styles.menuBody}>
                        {catalogList.length > 0 ? (
                            catalogList?.map((item: any) => (
                                <ResourceItem
                                    key={item.id}
                                    resourceData={item}
                                    checked={selectedItems.includes(item)}
                                    onChange={(checked) =>
                                        handleCheckboxChange(item, checked)
                                    }
                                    onRemove={() => handleRemove(item)}
                                />
                            ))
                        ) : (
                            <Empty style={{ marginBottom: 24 }} />
                        )}
                    </div>
                    <div className={styles.menuFooter}>
                        <div className={styles.menuFooterLeft}>
                            <Checkbox
                                checked={
                                    selectedItems.length > 0 &&
                                    selectedItems.length ===
                                        catalogList?.filter(
                                            (item: any) => item.is_online,
                                        ).length
                                }
                                indeterminate={
                                    selectedItems.length > 0 &&
                                    selectedItems.length <
                                        catalogList?.filter(
                                            (item: any) => item.is_online,
                                        ).length
                                }
                                onChange={(e) =>
                                    handleSelectAll(e.target.checked)
                                }
                            >
                                {__('全选')}
                            </Checkbox>
                        </div>
                        <div className={styles['menuFooter-Opr']}>
                            <Button
                                onClick={() =>
                                    dispatch({
                                        type: actionType.OPEN_SHARELIST,
                                        payload: {
                                            ...citySharingData,
                                            open: false,
                                            inCogAsstOpen: false,
                                        },
                                    })
                                }
                            >
                                {__('取消')}
                            </Button>
                            <Tooltip
                                color="#fff"
                                title={
                                    isRemind ? (
                                        ''
                                    ) : (
                                        <span>
                                            {__('请选择目录后，再发起申请。')}
                                            <a onClick={handleRemind}>
                                                {__('不再提醒')}
                                            </a>
                                        </span>
                                    )
                                }
                                placement="topRight"
                                overlayInnerStyle={{
                                    color: 'rgb(0, 0, 0, 0.85)',
                                    minWidth: 260,
                                }}
                            >
                                <Button
                                    type="primary"
                                    disabled={selectedItems.length === 0}
                                    onClick={() => {
                                        dispatch({
                                            type: actionType.OPEN_SHARELIST,
                                            payload: {
                                                ...citySharingData,
                                                open: false,
                                                inCogAsstOpen: false,
                                            },
                                        })
                                        window.open(
                                            `/anyfabric/drmb/citySharing/shareApply?operate=create&resources=${encodeURIComponent(
                                                JSON.stringify(
                                                    selectedItems.map(
                                                        (item: any) =>
                                                            item.res_id,
                                                    ),
                                                ),
                                            )}`,
                                            '_self',
                                        )
                                        // navigator(
                                        //     `/citySharing/shareApply?operate=create&resources=${encodeURIComponent(
                                        //         JSON.stringify(
                                        //             selectedItems.map(
                                        //                 (item: any) =>
                                        //                     item.res_id,
                                        //             ),
                                        //         ),
                                        //     )}`,
                                        // )
                                    }}
                                >
                                    {__('确定')}
                                </Button>
                            </Tooltip>
                        </div>
                    </div>
                </>
            )}
        </div>
    )

    return (
        <Popover
            content={getContent()}
            showArrow={false}
            placement="bottomRight"
            trigger="click"
            open={
                inCogAsst
                    ? citySharingData?.inCogAsstOpen
                    : citySharingData?.open
            }
            onOpenChange={(bool) => {
                // setOpen(bool)
                dispatch({
                    type: actionType.OPEN_SHARELIST,
                    payload: {
                        ...citySharingData,
                        open: inCogAsst ? false : bool,
                        inCogAsstOpen: inCogAsst ? bool : false,
                    },
                })
            }}
            overlayClassName={styles.cityShareCard}
        >
            {children}
        </Popover>
    )
}

export default CityShareCard
