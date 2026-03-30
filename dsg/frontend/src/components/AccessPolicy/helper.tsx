import Icon, { ExclamationCircleFilled } from '@ant-design/icons'

import { message } from 'antd'
import { GlossaryIcon } from '@/components/BusinessDomain/GlossaryIcons'
import { AssetTypeEnum, PolicyActionEnum } from '@/core'
import {
    AppApiColored,
    AppDataContentColored,
    AssetAuthorizableOutlined,
    AssetDepartmentOutlined,
    AssetL1Outlined,
    AssetL2Outlined,
    AssetL3ActivityOutlined,
    AssetL3ObjectOutlined,
    AssetLogicEntityOutlined,
    AssetOrganizationOutlined,
    CloseOutlined,
    DataViewColored,
    DepartmentOutlined,
    ThemeOutlined,
} from '@/icons'
// import { SearchType } from '@/components/SearchLayout/const'
import { SearchType } from '@/ui/LightweightSearch/const'
import { LevelType } from './components/AccessTree/AccessDomainTree'
import { STATE, SwitchMode } from './const'
import __ from './locale'
import styles from './styles.module.less'
import { ReactComponent as userOutlined } from '@/assets/DataAssetsCatlg/userOutlined.svg'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import IndicatorManagementOutlined from '@/icons/IndicatorManagementOutlined'

/**
 * 获取指定最后分隔符后的文案
 * @param text 文本内容
 * @param separator 分隔符 默认 '/'
 * @returns 若存在分隔符则返回后续文本，否则返回传入文本
 */
export const getLastText = (text: string, separator: string = '/') => {
    if (!text) return ''
    const idx = text?.lastIndexOf(separator)
    return idx < 0 ? text : text?.substring(idx + 1)
}

export const textLabel = (text: string, defaultTxt: string = '--') => {
    if (typeof text !== 'string') return ''
    return (
        text || <span style={{ color: 'rgba(0,0,0,0.45)' }}>{defaultTxt}</span>
    )
}

export const labelText = (text: string) => {
    return textLabel(getLastText(text))
}

/**
 * 获取选中节点的标题
 * @param node
 * @returns
 */
export const getTitleByNode = (node: any) => {
    const [{ using }] = useGeneralConfig()

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {node?.id ? (
                    <>
                        “<span title={node?.name}>{node?.name}</span>”
                    </>
                ) : (
                    `${
                        node?.mode === SwitchMode.DOMAIN
                            ? __('业务对象内')
                            : __('组织架构内')
                    }${__('全部可授权')}`
                )}
                {__('的资源')}
            </div>
            {!node?.id && (
                <div
                    style={{
                        color: 'rgba(0, 0, 0, 0.45)',
                        fontSize: '12px',
                        marginTop: '4px',
                    }}
                >
                    {/* {node?.mode === SwitchMode.DOMAIN
                        ? '若您是主题域或资源的数据Owner，则可以进行主题域或资源授权'
                        : '若您是主题域或资源的数据Owner，则可以进行资源授权'} */}
                    {/* {__(
                        '下方列表显示您作为数据Owner、或拥有授权权限且${status}的资源去进行授权',
                        {
                            status: using === 1 ? __('已发布') : __('已上线'),
                        },
                    )} */}
                    {__('下方列表显示已上线的资源去进行授权')}
                </div>
            )}
        </div>
    )
}

export const getRelativeDomain = (arr: any[]) => {
    if (!arr?.length) return '--'

    const tips = arr?.map((o) => `${LevelType[o.type]}:${o?.name}`).join('\n')

    return (
        <div className={styles['rd-items']} title={tips}>
            {arr?.map((item) => (
                <div key={item.id} className={styles['rd-item']}>
                    <span className={styles['rd-item-icon']}>
                        <GlossaryIcon
                            width="20px"
                            type={item.type}
                            fontSize="20px"
                        />
                    </span>
                    <span className={styles['rd-item-name']}>{item.name}</span>
                </div>
            ))}
        </div>
    )
}

export const searchData: any = (isObj: boolean) => [
    {
        label: '查看对象',
        key: 'is_all',
        initLabel: '查看全部对象',
        options: [
            {
                label: isObj ? (
                    <span>
                        查看全部对象
                        <span
                            style={{
                                color: 'rgba(0,0,0,0.45)',
                                fontWeight: 'normal',
                            }}
                        >
                            (包含子主题)
                        </span>
                    </span>
                ) : (
                    <span>
                        查看全部对象
                        <span
                            style={{
                                color: 'rgba(0,0,0,0.45)',
                                fontWeight: 'normal',
                            }}
                        >
                            (包含子部门)
                        </span>
                    </span>
                ),
                value: true,
            },
            {
                label: isObj ? '仅查看当前主题的对象' : '仅查看当前部门的对象',
                value: false,
            },
        ],
        type: SearchType.Radio,
    },
]

/**
 * 资源图标
 */
export const AssetIcon = {
    authorizable: (
        <AssetAuthorizableOutlined style={{ color: 'rgba(0,0,0,0.85)' }} />
    ),
    organization: (
        <AssetOrganizationOutlined style={{ color: 'rgb(40 162 254)' }} />
    ),
    department: (
        <AssetDepartmentOutlined style={{ color: 'rgb(40 162 254)' }} />
    ),
    subject_domain_group: (
        <AssetL1Outlined style={{ color: 'rgb(158 122 187)' }} />
    ),
    subject_domain: <AssetL2Outlined style={{ color: 'rgb(223 156 25)' }} />,
    business_activity: (
        <AssetL3ActivityOutlined style={{ color: 'rgb(110 196 114)' }} />
    ),
    business_object: (
        <AssetL3ObjectOutlined style={{ color: 'rgb(110 196 114)' }} />
    ),
    logic_entity: (
        <AssetLogicEntityOutlined style={{ color: 'rgb(40 162 254)' }} />
    ),
}

export const ResIcon = {
    [AssetTypeEnum.Domain]: (
        <AssetL2Outlined style={{ color: 'rgb(223 156 25)' }} />
    ),
    [AssetTypeEnum.DataCatalog]: (
        <AppDataContentColored
            style={{
                fontSize: 20,
            }}
        />
    ),
    [AssetTypeEnum.Api]: (
        <AppApiColored
            style={{
                fontSize: 20,
            }}
        />
    ),
    [AssetTypeEnum.DataView]: (
        <DataViewColored
            style={{
                fontSize: 20,
            }}
        />
    ),
    [AssetTypeEnum.Indicator]: (
        <div className={styles.iconContainer}>
            <IndicatorManagementOutlined
                style={{
                    color: '#fff',
                    fontSize: 20,
                }}
            />
        </div>
    ),
}

export const AssetStateTip = {
    [STATE.Published]: (
        <div>
            {__('当前资源已发布')}（
            <span>
                {__(
                    '资源还未上线，完成授权后需要将其上线，授权用户才可查看或使用',
                )}
                ）
            </span>
        </div>
    ),
    // [STATE.Online]: (
    //     <div>
    //         {__('当前资源已上线')}
    //         <span>（{__('完成授权后，授权用户才可查看或使用')}）</span>
    //     </div>
    // ),
    // [STATE.Offline]: (
    //     <div>
    //         {__('当前资源已下线')}
    //         <span>（{__('再次上线后，授权用户才可查看或使用')}）</span>
    //     </div>
    // ),
}

export interface DepartInfoItem {
    department_id: string
    department_name: string
}

/**
 * 根据部门二维数组查询标题和提示语
 */
export const getDepartLabelByDepartments = (
    departments: DepartInfoItem[][],
) => {
    const title = departments
        ?.reduce((prev: string[], cur: DepartInfoItem[]) => {
            const superiorName = cur?.[cur.length - 1]?.department_name
            return prev.concat(superiorName)
        }, [])
        .join('、')
    const tip = departments
        ?.reduce((prev: string[], cur: DepartInfoItem[]) => {
            const superiorsNamePath = cur
                ?.map((o) => o.department_name)
                .join('/')
            return prev.concat(superiorsNamePath)
        }, [])
        .join('、')

    return { title, tip }
}

export const getCurrentPath = (path: string) => {
    if (!path) return ''
    let ret = ''
    if (path?.includes('、')) {
        ret = path
            ?.split('、')
            ?.map((o) => o.split('/').pop())
            .filter((o) => !!o)
            .join('、')
    } else {
        ret = path.split('/').pop() ?? ''
    }

    return ret
}

// 获取父级路径
export const getParentDepartment = (path: string) => {
    const isHasSplit = path?.includes('/')
    const depart = isHasSplit
        ? getCurrentPath(path?.substring(0, path.lastIndexOf('/')))
        : path
    return depart ? [{ department_name: depart }] : undefined
}

// 业务逻辑实体列表项参数
export const itemOtherInfo = [
    {
        firstKey: 'service_info',
        infoKey: 'subject_domain_name',
        title: <ThemeOutlined style={{ fontSize: 16 }} />,
        toolTipTitle: `${__('所属主题')}：`,
    },
    {
        firstKey: 'service_info',
        infoKey: 'department',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门')}：`,
    },
    {
        firstKey: 'service_info',
        infoKey: 'owner_name',
        title: (
            <Icon
                component={userOutlined}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据Owner')}：`,
    },
]

/**
 * 忽略大小写匹配查询
 */
export const isContainerIgnoreCase = (container: string, item: string) => {
    return container?.toLowerCase().includes(item?.toLowerCase())
}

/**
 * 追加属性标签
 * @param arr
 * @param props
 * @returns
 */
export const appendArrProps = (arr: any[], props: Record<string, any>) => {
    return (arr || []).map((o) => ({ ...o, ...props }))
}

/**
 * 排序方法
 * @param attr 指定属性
 */
export const sortByAttr = (a, b, attr) => {
    return a?.[attr]?.localeCompare(b?.[attr])
}

export const showRequestMessage = (onLinkClick, microWidgetProps) => {
    if (microWidgetProps?.components?.toast) {
        microWidgetProps?.components?.toast.success(__('提交申请成功'))
        return
    }
    message.open({
        content: (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgba(0, 0, 0, 0.65)',
                }}
            >
                <ExclamationCircleFilled
                    style={{
                        color: '#3a8ff0',
                        marginRight: '8px',
                        top: 0,
                    }}
                />
                <div>
                    提交申请正在审核中，您可前往
                    <span
                        style={{ color: '#3a8ff0', cursor: 'pointer' }}
                        onClick={() => {
                            if (onLinkClick) {
                                message.destroy('auth-request')
                                onLinkClick()
                            }
                        }}
                    >
                        「我的-审核待办」
                    </span>
                    中查看进度
                </div>
                <CloseOutlined
                    style={{
                        marginLeft: '16px',
                        marginRight: 0,
                        top: 0,
                    }}
                    onClick={() => message.destroy('auth-request')}
                />
            </div>
        ),
        duration: 5,
        key: 'auth-request',
    })
}

/**
 * 转换申请数据
 * @param data 原始数据
 * @param actions 需要屏蔽的权限
 * @returns 转换后的数据
 */
export const transApplyData = (data: any, actions: PolicyActionEnum[]) => {
    if (!data || !actions || !Array.isArray(actions)) {
        return data
    }

    // 深拷贝数据，避免修改原始数据
    const newData = JSON.parse(JSON.stringify(data))

    // 处理 subjects 数组中的 permissions
    if (newData.subjects && Array.isArray(newData.subjects)) {
        newData.subjects = newData.subjects
            .map((subject: any) => {
                if (subject.permissions && Array.isArray(subject.permissions)) {
                    // 过滤掉 action 在 actions 中的权限
                    const filteredPermissions = subject.permissions.filter(
                        (permission: any) =>
                            !actions.includes(permission.action),
                    )
                    return {
                        ...subject,
                        permissions: filteredPermissions,
                    }
                }
                return subject
            })
            .filter((subject: any) => {
                // 如果过滤后的权限为空，则过滤掉该 subject
                return subject?.permissions?.length > 0
            })
    }

    // 处理 subjects_extend 数组中的 permissions
    if (newData.subjects_extend && Array.isArray(newData.subjects_extend)) {
        newData.subjects_extend = newData.subjects_extend
            .map((subject: any) => {
                if (subject.permissions && Array.isArray(subject.permissions)) {
                    // 过滤掉 action 在 actions 中的权限
                    const filteredPermissions = subject.permissions.filter(
                        (permission: any) =>
                            !actions.includes(permission.action),
                    )
                    return {
                        ...subject,
                        permissions: filteredPermissions,
                    }
                }
                return subject
            })
            .filter((subject: any) => {
                // 如果过滤后的权限为空，则过滤掉该 subject
                return subject?.permissions?.length > 0
            })
    }

    return newData
}

/**
 * 转换变更数据
 * @param changedSubjects 变更数据
 * @param originData 原始数据
 * @returns 转换后的数据
 */
export const transChangeData = (changedSubjects: any[], originData: any[]) => {
    if (!changedSubjects || !originData) {
        return changedSubjects
    }

    const newData = JSON.parse(JSON.stringify(changedSubjects))

    // 遍历变更数据，查找对应的原始数据
    return newData.map((changedSubject: any) => {
        const { subject_id } = changedSubject

        // 在原始数据中查找相同 subject_id 的数据
        const originSubject = originData?.find(
            (origin: any) => origin?.subject_id === subject_id,
        )

        if (originSubject?.permissions?.length > 0) {
            // 获取原始数据中的授权和授权仅分配权限
            const authPermissions = originSubject.permissions.filter(
                (permission: any) =>
                    [PolicyActionEnum.Auth, PolicyActionEnum.Allocate].includes(
                        permission?.action,
                    ),
            )

            // 如果原始数据中存在这些权限，则补全到变更数据中
            if (authPermissions?.length > 0) {
                // 确保变更数据有 permissions 数组
                const currentPermissions = changedSubject.permissions || []

                // 补全授权和授权仅分配权限
                const enhancedPermissions = [...currentPermissions]
                authPermissions.forEach((authPermission: any) => {
                    // 检查是否已经存在相同的权限
                    const exists = enhancedPermissions.some(
                        (permission: any) =>
                            permission.action === authPermission.action &&
                            permission.effect === authPermission.effect,
                    )

                    // 如果不存在，则添加
                    if (!exists) {
                        enhancedPermissions.push({
                            ...authPermission,
                        })
                    }
                })

                return {
                    ...changedSubject,
                    permissions: enhancedPermissions,
                }
            }
        }

        return changedSubject
    })
}
