import React, { useEffect, useState } from 'react'
import { Drawer, Table, Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import CommonTitle from '../CommonTitle'
import FormViewExampleData from '@/components/DatasheetView/FormViewExampleData'
import ViewRules from './ViewRules'
import {
    IDemandVisitor,
    ILogicViewAuthSpecPolicies,
    IReferenceInfo,
    getLogicViewAuth,
    getSubViews,
} from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import ViewRulesModal from './ViewRulesModal'
import { AuthorityNameMap } from './const'

const enum TabsEnum {
    Permission = 'permission',
    Sample = 'sample',
}

interface IViewPermission {
    open: boolean
    onClose: () => void
    name: string
    viewid: string
    sheetId: string
}
const ViewPermission: React.FC<IViewPermission> = ({
    open,
    onClose,
    name,
    viewid,
    sheetId,
}) => {
    // const [activeKey, setActiveKey] = useState<TabsEnum>(TabsEnum.Permission)
    const [rulesOpen, setRuleOpen] = useState(false)
    const [operateData, setOperateData] = useState<IDemandVisitor>()
    const [logicViewDataSource, setLogicViewDataSource] = useState<any[]>([])
    const [rulesDataSource, setRulesDataSource] = useState<any[]>([])

    const getAuth = async () => {
        const res = await getLogicViewAuth(viewid, {
            reference: true,
        })
        const subViewsRes = await getSubViews({
            logic_view_id: sheetId || res?.spec?.id,
            limit: 1000,
        })

        const users = (res.references || [])
            .filter((o) => o.user)
            .map((o) => o.user)
        const departments = (res.references || [])
            .filter((o) => o.department)
            .map((o) => o.department)

        setLogicViewDataSource(
            res.spec.policies?.map((o) => {
                const user = users?.find((it) => it.id === o.subject_id)
                const departs = departments?.filter((it) =>
                    user.department_ids?.includes(it.id),
                )
                const department = departs?.map((it) => it?.name)?.join('/')
                return {
                    ...o,
                    subject_name: user?.name,
                    department,
                }
            }),
        )
        setRulesDataSource(
            res.spec?.sub_views?.map((o) => {
                const userIds = o?.policies.map((it) => it.subject_id)
                const user = users
                    ?.filter((it) => userIds.includes(it.id))
                    ?.map((it) => it?.name)
                    ?.join('、')
                if (o.id) {
                    return {
                        ...o,
                        name: subViewsRes.entries.find(
                            (item) => item.id === o.id,
                        )?.name,
                        user,
                        references: res.references,
                        detail: subViewsRes.entries.find(
                            (item) => item.id === o.id,
                        )?.detail,
                        logic_view_id: sheetId || res?.spec?.id,
                    }
                }

                return {
                    ...o,
                    ...o?.spec,
                    user,
                    references: res.references,
                }
            }),
        )
    }

    useEffect(() => {
        if (viewid) {
            getAuth()
        }
    }, [viewid])

    const logicViewColumns = [
        {
            title: __('访问者'),
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
        },
        {
            title: __('所属部门'),
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
        },
        {
            title: __('访问权限'),
            dataIndex: 'actions',
            key: 'actions',
            width: 220,
            render: (actions: string[]) =>
                actions
                    .sort(
                        (a, b) =>
                            b.toLowerCase().charCodeAt(0) -
                            a.toLowerCase().charCodeAt(0),
                    )
                    .map((action) => AuthorityNameMap[action])
                    .join('/'),
        },
    ]

    const rulesColumns = [
        {
            title: __('行列规则名称'),
            dataIndex: 'name',
            key: 'name',
            render: (ruleName) => (
                <span>
                    <FontIcon
                        name="icon-hangliequanxian"
                        type={IconType.COLOREDICON}
                        style={{ marginRight: 8 }}
                    />
                    {ruleName}
                </span>
            ),
            ellipsis: true,
        },
        {
            title: __('访问者'),
            dataIndex: 'user',
            key: 'user',
            ellipsis: true,
        },
        {
            title: __('操作'),
            dataIndex: 'action',
            key: 'action',
            width: 220,
            render: (_, record) => (
                <a
                    onClick={() => {
                        setRuleOpen(true)
                        setOperateData(record)
                    }}
                >
                    {__('查看')}
                </a>
            ),
        },
    ]

    // const onChange = (key: string) => {
    //     setActiveKey(key as TabsEnum)
    // }

    return (
        <Drawer
            title={
                <div className={styles['view-permission-title']}>
                    {__('查看')}
                    <FontIcon
                        name="icon-shujubiaoshitu"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                    />
                    <div className={styles.name} title={name}>
                        {name}
                    </div>
                </div>
            }
            placement="right"
            width={1254}
            onClose={onClose}
            open={open}
        >
            <div className={styles['view-permission-wrapper']}>
                {/* <Tabs
                    activeKey={activeKey}
                    onChange={onChange}
                    items={[
                        {
                            label: __('权限信息'),
                            key: TabsEnum.Permission,
                        },
                        {
                            label: __('样例数据'),
                            key: TabsEnum.Sample,
                        },
                    ]}
                /> */}
                <CommonTitle title={__('库表')} />
                <div className={styles['table-container']}>
                    {logicViewDataSource?.length > 0 ? (
                        <Table
                            dataSource={logicViewDataSource}
                            columns={logicViewColumns}
                            pagination={false}
                            rowKey="id"
                        />
                    ) : (
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    )}
                </div>
                <CommonTitle title={__('行/列规则')} />
                <div className={styles['table-container']}>
                    {rulesDataSource?.length > 0 ? (
                        <Table
                            dataSource={rulesDataSource}
                            columns={rulesColumns}
                            pagination={false}
                            rowKey={(record) => record.id || ''}
                            locale={{
                                emptyText: <Empty iconSrc={dataEmpty} />,
                            }}
                        />
                    ) : (
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    )}
                </div>
                {/* {activeKey === TabsEnum.Sample && (
                    <FormViewExampleData id={viewid} />
                )} */}
                {rulesOpen && (
                    <ViewRulesModal
                        open={rulesOpen}
                        onClose={() => setRuleOpen(false)}
                        rulesDetails={operateData}
                    />
                )}
            </div>
        </Drawer>
    )
}
export default ViewPermission
