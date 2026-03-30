import { Table, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'
import moment from 'moment'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'
import __ from './locale'
import styles from './styles.module.less'
import { FontIcon, InfotipOutlined, UserOutlined } from '@/icons'
import { AssetTypeEnum } from '@/core'

const ActionText = {
    view: '查看',
    read: '读取',
    download: '下载',
}

type IDepart = {
    id: string
    name: string
    parent_id?: string
}

/**
 * 通过Id获取部门数据
 * @param departments  部门数组
 * @param id  索引ID
 * @param type 默认为用户
 * @returns  [a,b,c,d]
 */
const findDepartsById = (departments: IDepart[], id: string) => {
    if (!id) return ''
    const parent = departments?.find((it) => it.id === id)

    return parent
        ? parent?.parent_id
            ? [parent.name].concat(
                  findDepartsById(departments, parent?.parent_id),
              )
            : [parent.name]
        : []
}

function TabVisitor({ data, reference, type = '' }: any) {
    const [dataSource, setDataSource] = useState<any[]>([])
    const tableRef = useRef<HTMLDivElement>(null)
    useEffect(() => {
        const users = (reference || []).filter((o) => o.user).map((o) => o.user)
        const applications = (reference || [])
            .filter((o) => o.application)
            .map((o) => o.application)
        const departments = (reference || [])
            .filter((o) => o.department)
            .map((o) => o.department)

        setDataSource(
            data?.map((o) => {
                const { actions, ...rest } = o
                const user = users?.find((it) => it.id === o.subject_id)
                const application = applications?.find(
                    (it) => it.id === o.subject_id,
                )
                const departIds = user?.department_ids || []
                const departNameArr: string[] = []
                const departTipArr: string[] = []
                departIds.forEach(async (it) => {
                    const paths = findDepartsById(departments, it)
                    const pathArr = (paths || []).reverse()

                    if (pathArr?.length) {
                        departNameArr.push(pathArr[0])
                        departTipArr.push(pathArr.join('/'))
                    }
                })

                const department = {
                    name: departNameArr?.join('、'),
                    tip: departTipArr?.join('、'),
                }
                return {
                    ...o,
                    subject_name: user?.name || application?.name,
                    department,
                    permissions: o.actions,
                    // permissions: actions?.map((a) => ({
                    //     action: a,
                    //     effect: 'allow',
                    // })),
                }
            }),
        )
    }, [data, reference])

    const Columns: any = [
        {
            title: '访问者',
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
            render: (text, record) => (
                <div className={styles.nameWrapper}>
                    {record.subject_type === 'app' ? (
                        <FontIcon name="icon-jichengyingyong-xianxing" />
                    ) : (
                        <UserOutlined style={{ fontSize: '18px' }} />
                    )}
                    <span className={styles.text} title={text}>
                        {text ||
                            (record.subject_type === 'user'
                                ? __('未知用户')
                                : __('未知应用'))}
                    </span>
                    {record?.user_status === 'Deleted' && (
                        <Tooltip
                            color="#fff"
                            overlayInnerStyle={{
                                color: 'rgba(0,0,0,0.85)',
                            }}
                            title={__(
                                '当前用户不在组织架构中，可将其权限进行删除操作',
                            )}
                        >
                            <span className={styles.deleted}>
                                {__('已删除')}
                            </span>
                        </Tooltip>
                    )}
                </div>
            ),
        },
        {
            title: '访问者类型',
            dataIndex: 'subject_type',
            key: 'subject_type',
            ellipsis: true,
            render: (text) => (text === 'app' ? __('集成应用') : __('用户')),
        },
        {
            title: '所属部门',
            dataIndex: 'department',
            key: 'department',
            ellipsis: true,
            render: (department: { name: string; tip: string }) => {
                return (
                    <span title={department.tip || '无'}>
                        {department.name || '--'}
                    </span>
                )
            },
        },
        {
            title: (
                <div className={styles.tooltip}>
                    <span className={styles['tooltip-span']}>
                        {__('访问权限')}
                    </span>
                    <Tooltip
                        title={
                            <div>
                                <div className={styles['tooltip-panel']}>
                                    <span>{__('读取')}：</span>
                                    <span>
                                        {type === AssetTypeEnum.Indicator
                                            ? __('可查询指标预览查询指标数据')
                                            : type === AssetTypeEnum.Api
                                            ? __('可调用接口服务中的真实数据')
                                            : __('可见库表中的真实数据')}
                                    </span>
                                </div>
                                {![
                                    AssetTypeEnum.Api,
                                    AssetTypeEnum.Indicator,
                                ].includes(type as AssetTypeEnum) && (
                                    <div className={styles['tooltip-panel']}>
                                        <span>{__('下载')}：</span>
                                        <span>
                                            {__('可下载库表中的真实数据')}
                                        </span>
                                    </div>
                                )}
                            </div>
                        }
                        color="#fff"
                        placement="bottomRight"
                        getPopupContainer={(triggerNode) =>
                            (tableRef?.current as HTMLElement) || triggerNode
                        }
                    >
                        <InfotipOutlined />
                    </Tooltip>
                </div>
            ),
            dataIndex: 'permissions',
            key: 'permissions',
            render: (item) => {
                return item?.map((o) => ActionText[o]).join('/')
                // const optAccess = (record.permissions ?? []).map(
                //     (o) => AccessOptMap[`${o.action}-${o.effect}`],
                // )
                // const label = getLabelByPermission(optAccess)
                // return (
                //     <Select
                //         value={{
                //             label: `${label ? `${label}/` : ''}授权`,
                //             value: calcByte(optAccess),
                //         }}
                //         style={{ width: '100%' }}
                //         placeholder={__('请设置访问权限')}
                //         disabled
                //     />
                // )
            },
        },
        {
            title: __('有效期至'),
            dataIndex: 'expired_at',
            key: 'expired_at',
            render: (text) => {
                const expiredStatus =
                    moment(text).valueOf() < moment().valueOf()
                return text ? (
                    <div>
                        <span>{moment(text).format('YYYY-MM-DD HH:mm')}</span>
                        {expiredStatus && (
                            <span style={{ color: '#ff4d4f' }}>
                                {__('已失效')}
                            </span>
                        )}
                    </div>
                ) : (
                    __('永久有效')
                )
            },
        },
    ]

    return (
        <div ref={tableRef}>
            <Table
                columns={Columns.filter(
                    (current) => type !== 'api' || current.key !== 'department',
                )}
                dataSource={dataSource}
                scroll={{
                    y: `calc(100vh - 50px)`,
                }}
                rowKey="subject_id"
                locale={{
                    emptyText: <Empty desc="暂无数据" iconSrc={dataEmpty} />,
                }}
                pagination={false}
            />
        </div>
    )
}

export default TabVisitor
