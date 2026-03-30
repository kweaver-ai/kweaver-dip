import React, { useEffect, useMemo, useState } from 'react'
import {
    Button,
    Checkbox,
    Drawer,
    message,
    Modal,
    Popconfirm,
    Space,
    Tooltip,
} from 'antd'
import { useNavigate } from 'react-router-dom'
import {
    CheckCircleFilled,
    ExclamationCircleFilled,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import classNames from 'classnames'
import styles from './styles.module.less'
import { CloseOutlined, JumpOutlined, RecycleBinOutlined } from '@/icons'
import actionType from '@/redux/actionType'
import { getActualUrl, rewriteUrl } from '@/utils'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { ServiceType } from '../DataAssetsCatlg/helper'
import {
    chooseRepositorys,
    formatError,
    getRepositorys,
    IRepository,
    removeRepositorys,
} from '@/core'
import __ from './locale'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const enum ResStatus {
    NORMAL = 1,
    LOSEEFFECTIVE = 2,
    UPDATE = 3,
}
interface IAssetsLibrary {
    open: boolean
    onClose: () => void
}
const AssetsLibrary: React.FC<IAssetsLibrary> = ({ open, onClose }) => {
    const { checkPermission } = useUserPermCtx()
    const navigator = useNavigate()

    const dispatch = useDispatch()
    const assetsData = useSelector((state: any) => state?.dataAssetsReducer)
    const [data, setData] = useState<IRepository[]>([])
    const [selectedKeys, setSelectedKeys] = useState<string[]>([])

    // 全选的中间状态
    const indeterminate = useMemo(() => {
        const tempData = data.filter(
            (item) => item.res_status !== ResStatus.LOSEEFFECTIVE,
        )

        return (
            selectedKeys.length < tempData.length && selectedKeys.length !== 0
        )
    }, [selectedKeys, data])

    const checkedAll = useMemo(() => {
        const tempData = data.filter(
            (item) => item.res_status !== ResStatus.LOSEEFFECTIVE,
        )

        return (
            selectedKeys.length === tempData.length && selectedKeys.length !== 0
        )
    }, [selectedKeys, data])

    const getShopCartData = async () => {
        const res = await getRepositorys()
        setData(res.entries)
        setSelectedKeys(
            res.entries
                .filter((item) => item.res_status !== ResStatus.LOSEEFFECTIVE)
                .map((item) => {
                    return item.id
                }),
        )
    }

    useEffect(() => {
        if (open) {
            getShopCartData()
        }
    }, [open])

    const handleCheckAll = (e) => {
        if (e.target.checked) {
            setSelectedKeys(
                data
                    .filter(
                        (item) => item.res_status !== ResStatus.LOSEEFFECTIVE,
                    )
                    .map((item) => item.id),
            )
        } else {
            setSelectedKeys([])
        }
    }

    const handleCheckItem = (e, checkItem) => {
        if (e.target.checked) {
            setSelectedKeys([...selectedKeys, checkItem.id])
        } else {
            setSelectedKeys(selectedKeys.filter((id) => id !== checkItem.id))
        }
    }

    const handleDelete = async (record: IRepository) => {
        // 移除成功更新资源库数字
        try {
            await removeRepositorys(record.res_id)
            message.success('删除成功')
            setData(data.filter((item) => item.res_id !== record.res_id))
            setSelectedKeys(selectedKeys.filter((key) => key !== record.id))
            dispatch({
                type: actionType.SET_DATA_ASSETS,
                payload: {
                    dataAssetIds:
                        assetsData.dataAssetIds?.filter(
                            (id) => id !== record.res_id,
                        ) || [],
                },
            })
        } catch (error) {
            formatError(error)
        }
    }

    const handleSubmit = async () => {
        if (selectedKeys.length === 0) {
            message.error(__('请选择资源'))
            return
        }
        try {
            await chooseRepositorys({ ids: selectedKeys })
            handleToRequirement()
            onClose()
        } catch (error) {
            formatError(error)
            getShopCartData()
        }
    }

    const handleToAssetsDetails = (id: string) => {
        const url = getActualUrl(`/data-assets`)
        window.open(url, '_blank')
    }

    const handleToRequirement = (carryRes = true) => {
        let url = ''
        url = carryRes
            ? `/dataService/requirement/create?carryRes=1`
            : `/dataService/requirement/create`
        navigator(url)
    }
    return (
        <Drawer
            title="申请清单"
            width={400}
            open={open}
            onClose={onClose}
            destroyOnClose
            zIndex={1001}
            footer={
                data.length === 0 ? null : (
                    <>
                        <Tooltip
                            placement="top"
                            title="提交申请后，可补充您所需要的资源一起申请"
                        >
                            <Space size={4}>
                                <QuestionCircleOutlined />
                                资源不全
                            </Space>
                        </Tooltip>
                        <Space size={12}>
                            <Button onClick={onClose}>取消</Button>
                            {checkPermission(
                                [
                                    { key: 'manageDataResourceCatalog' },
                                    { key: 'analysisAndImplementSupplyDemand' },
                                ],
                                'or',
                                true,
                            ) && (
                                <Button type="primary" onClick={handleSubmit}>
                                    申请
                                </Button>
                            )}
                        </Space>
                    </>
                )
            }
            footerStyle={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}
        >
            <div className={styles.assetsWrapper}>
                <div
                    className={styles.assetsInstruction}
                    hidden={data.length > 0}
                >
                    <ExclamationCircleFilled className={styles.tipIcon} />
                    <div className={styles.tipContent}>
                        暂无可申请资源，您可以在资源目录下添加申请资源，若未找到所需资源，可前往「需求申请」中申请空白资源。
                    </div>
                </div>
                <div hidden={data.length > 0} className={styles.emptyWrapper}>
                    <Empty desc="暂无数据" iconSrc={dataEmpty} />
                    <Button
                        type="primary"
                        className={styles.applyBtn}
                        onClick={() => handleToRequirement(false)}
                    >
                        需求申请
                        {/* <JumpOutlined className={styles.jumpIcon} /> */}
                    </Button>
                </div>
                <div className={styles.dataWrapper} hidden={data.length === 0}>
                    <div className={styles.checkAllContainer}>
                        <Space size={12}>
                            <Checkbox
                                onChange={handleCheckAll}
                                indeterminate={indeterminate}
                                checked={checkedAll}
                            />
                            <div>{`全选（${selectedKeys.length}）`}</div>
                        </Space>
                    </div>
                    {data.map((item) => (
                        <div
                            className={classNames({
                                [styles.item]: true,
                                [styles.loseEffectiveItem]:
                                    item.res_status === ResStatus.LOSEEFFECTIVE,
                            })}
                            key={item.id}
                        >
                            <div className={styles.top}>
                                <div className={styles.left}>
                                    <Checkbox
                                        checked={selectedKeys.includes(item.id)}
                                        onChange={(e) =>
                                            handleCheckItem(e, item)
                                        }
                                        disabled={
                                            item.res_status ===
                                            ResStatus.LOSEEFFECTIVE
                                        }
                                    />
                                    <div
                                        className={styles.resName}
                                        title={item.res_name}
                                        onClick={() => {
                                            if (
                                                item.res_status ===
                                                ResStatus.LOSEEFFECTIVE
                                            )
                                                return
                                            // 判断是否有 数据目录 查看权限
                                            if (
                                                checkPermission(
                                                    'accessDataResource',
                                                )
                                            ) {
                                                handleToAssetsDetails(
                                                    item.res_id,
                                                )
                                            }
                                        }}
                                    >
                                        {item.res_name}
                                    </div>
                                    {item.res_status ===
                                        ResStatus.LOSEEFFECTIVE && (
                                        <div
                                            className={styles.loseEffectiveFlag}
                                        >
                                            已失效
                                        </div>
                                    )}
                                </div>
                                {checkPermission(
                                    [
                                        {
                                            key: 'manageDataResourceCatalog',
                                        },
                                        {
                                            key: 'analysisAndImplementSupplyDemand',
                                        },
                                    ],
                                    'or',
                                    true,
                                ) && (
                                    <Popconfirm
                                        title="你确定要删除吗？"
                                        onConfirm={() => handleDelete(item)}
                                        okText="确定"
                                        cancelText="取消"
                                        placement="left"
                                    >
                                        <RecycleBinOutlined />
                                    </Popconfirm>
                                )}
                            </div>
                            <div
                                className={styles.itemDesc}
                                title={item.res_desc}
                            >
                                {item.res_desc}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Drawer>
    )
}

export default AssetsLibrary
