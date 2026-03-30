import React, { useEffect, useState } from 'react'
import { Button, Drawer, Space, Table, message } from 'antd'
import __ from './locale'
import styles from './styles.module.less'
import CommonTitle from './CommonTitle'
import VisitorCard from './VisitorCard'
import { VisitorProvider } from './VisitorProvider'
import { AddOutlined, FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import ColumnRuleConfig from './ColumnRuleConfig'
import {
    AssetTypeEnum,
    ISubView,
    PolicyActionEnum,
    formatError,
    getDatasheetViewDetails,
    getLogicViewAuth,
    getSubViews,
    getVisitorAuth,
    policyValidate,
} from '@/core'
import { Permission } from './const'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'

interface IApplyPermission {
    open: boolean
    onClose: () => void
    applierId: string
    sheetId: string
    sheetName: string
    onOk: (data) => void
    editData?: any
    authApplyId?: string
}

const ApplyPermission: React.FC<IApplyPermission> = ({
    open,
    onClose,
    applierId,
    sheetId,
    sheetName,
    onOk,
    editData,
    authApplyId,
}) => {
    const [addRuleOpen, setAddRuleOpen] = useState(false)

    const [dataSource, setDataSource] = useState<any[]>([])
    const [operateItem, setOperateItem] = useState()
    const [operateIndex, setOperateIndex] = useState()

    const [visitors, setVisitors] = useState<any[]>([])
    const [subViews, setSubViews] = useState<ISubView[]>([])
    const [visitorPermission, setVisitorPermission] = useState<{
        [key: string]: Permission
    }>({})

    useEffect(() => {
        if (editData) {
            setVisitors(editData.spec.policies)
            setDataSource(editData.spec.sub_views)
        }
    }, [editData])

    // 获取访问者的库表权限
    const getVisitorExistPermission = async (vs) => {
        const res = await Promise.all(
            vs.map((v) =>
                getVisitorAuth({
                    subject_id: v.subject_id,
                    object_type: AssetTypeEnum.DataView,
                    subject_type: 'user',
                }),
            ),
        )
        const permissions = {}
        res.forEach((r, pIndex) => {
            if (r.entries.length > 0) {
                const sheetPer = r.entries.find(
                    (item) => item.object_id === sheetId,
                )
                if (sheetPer) {
                    const downloadPer = sheetPer.permissions.find(
                        (p) => p.action === Permission.Download,
                    )
                    if (downloadPer && downloadPer.effect === 'allow') {
                        permissions[vs[pIndex].subject_id] = Permission.Download
                    } else {
                        const readPer = sheetPer.permissions.find(
                            (p) => p.action === Permission.Read,
                        )
                        if (readPer && readPer.effect === 'allow') {
                            permissions[vs[pIndex].subject_id] = Permission.Read
                        }
                    }
                }
            }
        })
        setVisitorPermission({ ...visitorPermission, ...permissions })
        setVisitors(
            visitors.map((item) => {
                if (item.actions.length === 0) {
                    if (permissions[item.subject_id] === Permission.Download) {
                        return {
                            ...item,
                            actions: [Permission.Read, Permission.Download],
                        }
                    }
                    if (permissions[item.subject_id] === Permission.Read) {
                        return {
                            ...item,
                            actions: [Permission.Read],
                        }
                    }
                    return item
                }
                return item
            }),
        )
    }

    useEffect(() => {
        if (visitors.length > 0) {
            getVisitorExistPermission(visitors)
        }
    }, [visitors.length])

    // 获取子库表列表-回显已选的子库表
    const getSubViewsList = async () => {
        try {
            const res = await getSubViews({
                logic_view_id: sheetId,
                limit: 1000,
            })
            setSubViews(res.entries)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getSubViewsList()
    }, [])

    const getAuth = async () => {
        const res = await getLogicViewAuth(authApplyId!, {
            reference: true,
        })
        const subViewsRes = await getSubViews({
            logic_view_id: sheetId,
            limit: 1000,
        })

        const users = (res.references || [])
            .filter((o) => o.user)
            .map((o) => o.user)
        const departments = (res.references || [])
            .filter((o) => o.department)
            .map((o) => o.department)

        if (res.spec.sub_views && Array.isArray(res.spec.sub_views)) {
            setDataSource(
                res.spec.sub_views.map((sv) => {
                    const policies = sv.policies.map((o) => {
                        const user = users?.find((it) => it.id === o.subject_id)
                        const departs = departments?.filter((it) =>
                            user.department_ids?.includes(it.id),
                        )
                        const department = departs
                            ?.map((it) => it?.name)
                            ?.join('/')
                        return {
                            ...o,
                            subject_name: user?.name,
                            departments: department,
                        }
                    })
                    if (sv.id) {
                        return {
                            ...sv,
                            name: subViewsRes.entries.find(
                                (item) => item.id === sv.id,
                            )?.name,
                            policies,
                        }
                    }
                    return {
                        ...sv,
                        policies,
                    }
                }),
            )
        }

        setVisitors(
            res.spec.policies?.map((o) => {
                const user = users?.find((it) => it.id === o.subject_id)
                const departs = departments?.filter((it) =>
                    user.department_ids?.includes(it.id),
                )
                const department = departs?.map((it) => it?.name)?.join('/')
                return {
                    ...o,
                    subject_name: user?.name,
                    departments: department,
                }
            }),
        )
    }

    useEffect(() => {
        if (authApplyId && !editData) {
            getAuth()
        }
    }, [authApplyId, editData])

    const columns: any = [
        {
            title: __('行列规则名称'),
            dataIndex: 'ruleName',
            key: 'ruleName',
            ellipsis: true,
            render: (_, record) => (
                <div className={styles['rule-name-container']}>
                    <FontIcon
                        name="icon-hangliequanxian"
                        type={IconType.COLOREDICON}
                        className={styles['rule-icon']}
                    />
                    <div
                        className={styles['rule-name']}
                        title={record?.spec?.name || record.name}
                    >
                        {record?.spec?.name || record.name || '--'}
                    </div>
                </div>
            ),
        },
        {
            title: __('访问者'),
            dataIndex: 'policies',
            key: 'policies',
            ellipsis: true,
            render: (_, record) =>
                record.policies.map((p) => p.subject_name).join('、'),
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (_, record, index) => {
                return (
                    <Space size={16}>
                        <Button
                            type="link"
                            onClick={() => {
                                setAddRuleOpen(true)
                                setOperateItem(record)
                                setOperateIndex(index + 1)
                            }}
                        >
                            {__('编辑')}
                        </Button>
                        <a
                            onClick={() =>
                                setDataSource(
                                    dataSource.filter((item, i) => i !== index),
                                )
                            }
                        >
                            {__('删除')}
                        </a>
                    </Space>
                )
            },
        },
    ]

    const handleConfigOk = (data) => {
        if (operateIndex) {
            setDataSource(
                dataSource.map((item, i) => {
                    if (i === operateIndex - 1) {
                        return data
                    }
                    return item
                }),
            )
        } else {
            setDataSource([...dataSource, data])
        }
        setOperateItem(undefined)
        setOperateIndex(undefined)
    }

    const handleOk = () => {
        const emptyVisitor = visitors.find(
            (v) => !v.actions || v.actions.length === 0,
        )
        if (emptyVisitor) {
            message.error(
                __('请选择${name}访问库表的权限', {
                    name: emptyVisitor.subject_name,
                }),
            )
            return
        }
        onOk({
            spec: {
                id: sheetId,
                suspend: true,
                reason: '',
                policies: visitors,
                sub_views: dataSource,
            },
        })
        onClose()
    }

    return (
        <Drawer
            title={
                <div className={styles['apply-permission-title']}>
                    {__('申请')}
                    <FontIcon
                        name="icon-shujubiaoshitu"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles['sheet-name']} title={sheetName}>
                        {sheetName}
                    </div>
                </div>
            }
            width={1064}
            open={open}
            onClose={onClose}
            footer={
                <Space className={styles['choose-resource-footer']}>
                    <Button
                        onClick={() => {
                            ReturnConfirmModal({
                                onCancel: onClose,
                                content: __(
                                    '离开此页将放弃当前更改的内容，请确认操作。',
                                ),
                            })
                        }}
                        className={styles.btn}
                    >
                        {__('取消')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={() => handleOk()}
                        className={styles.btn}
                    >
                        {__('确定')}
                    </Button>
                </Space>
            }
        >
            <VisitorProvider>
                <div className={styles['apply-permission-wrapper']}>
                    <div className={styles['sheet-permission-container']}>
                        <CommonTitle title={__('库表')} />
                        <VisitorCard
                            applierId={applierId}
                            onChange={(data) => setVisitors(data)}
                            value={visitors}
                            visitorPermission={visitorPermission}
                        />
                    </div>
                    <CommonTitle title={__('行/列规则')} />
                    <div className={styles['add-btn-container']}>
                        <Button
                            icon={<AddOutlined />}
                            type="link"
                            className={styles['add-btn']}
                            onClick={() => setAddRuleOpen(true)}
                        >
                            {__('添加行/列规则')}
                        </Button>
                    </div>
                    {dataSource.length === 0 ? (
                        <div className={styles['rule-empty-container']}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            rowKey="id"
                            pagination={false}
                        />
                    )}
                </div>
            </VisitorProvider>
            {addRuleOpen && (
                <ColumnRuleConfig
                    open={addRuleOpen}
                    sheetId={sheetId}
                    onClose={() => {
                        setAddRuleOpen(false)
                        setOperateItem(undefined)
                        setOperateIndex(undefined)
                    }}
                    onOk={handleConfigOk}
                    editData={operateItem}
                />
            )}
        </Drawer>
    )
}

export default ApplyPermission
