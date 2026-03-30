import { OptionProps } from 'antd/lib/select'
import __ from '../../locale'

/**
 * 操作类型
 */
export enum OptType {
    // /** 查看 */
    // View = 'view',
    /** 读取 */
    Read = 'read',
    /** 下载 */
    Download = 'download',
    /** 授权 */
    Auth = 'auth',
    /** 授权(仅分配) */
    Allocate = 'allocate',
}

/**
 * 权限类型
 */
export enum AccessType {
    /** 允许 */
    Allow = 'allow',
    /** 拒绝 */
    Deny = 'deny',
}

/**
 * 权限-值映射表
 */
export const AccessOptMap = {
    // /** 允许查看 */
    // [`${OptType.View}-${AccessType.Allow}`]: 1,
    // /** 拒绝查看 */
    // [`${OptType.View}-${AccessType.Deny}`]: 2, // 1 << 1
    /** 允许读取 */
    [`${OptType.Read}-${AccessType.Allow}`]: 4, // 1 << 2
    /** 拒绝读取 */
    [`${OptType.Read}-${AccessType.Deny}`]: 8, // 1 << 3
    /** 允许下载 */
    [`${OptType.Download}-${AccessType.Allow}`]: 16, // 1 << 4
    /** 拒绝下载 */
    [`${OptType.Download}-${AccessType.Deny}`]: 32, // 1 << 5
    /** 授权 */
    [`${OptType.Auth}-${AccessType.Allow}`]: 64, // 1 << 6
    /** 拒绝授权 */
    [`${OptType.Auth}-${AccessType.Deny}`]: 128, // 1 << 7
    /** 授权(仅分配) */
    [`${OptType.Allocate}-${AccessType.Allow}`]: 256, // 1 << 8
    /** 拒绝授权(仅分配) */
    [`${OptType.Allocate}-${AccessType.Deny}`]: 512, // 1 << 9
}

/**
 * 权限操作列表
 */
export const AccessOptsList = [
    // {
    //     label: __('查看'),
    //     value: OptType.View,
    // },
    {
        label: __('读取'),
        value: OptType.Read,
    },
    {
        label: __('下载'),
        value: OptType.Download,
    },
    {
        label: __('授权'),
        value: OptType.Auth,
    },
    {
        label: __('授权(仅分配)'),
        value: OptType.Allocate,
    },
]

/**
 * 权限值转换为权限列表
 * @param value
 * @returns
 */
export const transformPermission = (value: number) => {
    return Object.entries(AccessOptMap).reduce((prev, cur) => {
        const [k, v] = cur
        // eslint-disable-next-line no-bitwise
        if ((v & value) === v) {
            const [action, effect] = k.split('-')
            return prev.concat({ action, effect })
        }
        return prev
    }, [] as any)
}

/**
 * 权限值转换为权限元值列表
 * @param value
 * @returns
 */
export const getAccessArrByValue = (value: number) => {
    // eslint-disable-next-line no-bitwise
    return Object.values(AccessOptMap).filter((v) => (v & value) === v)
}

/**
 * 计算权限结果
 */
export const calcByte = (byteArr?: number[]) => {
    return byteArr?.reduce((prev, cur) => {
        if (!prev) return cur
        // eslint-disable-next-line no-bitwise
        return prev | cur
    }, 0)
}

/**
 * 勾选操作规则
 */
const CheckRules = {
    // // 允许查看
    // 1: [[1], [2]],
    // // 拒绝查看
    // 2: [
    //     [2, 8, 32],
    //     [1, 4, 16],
    // ],
    // 允许读取
    4: [
        [4, 1],
        [8, 2],
    ],
    // 拒绝读取
    8: [
        [8, 32],
        [4, 16],
    ],
    // 允许下载
    16: [
        [16, 4, 1],
        [32, 8, 2],
    ],
    // 拒绝下载
    32: [[32], [16]],
}

/**
 * 取消勾选操作规则
 */
const UnCheckRules = {
    // 1: [[], [1]],
    // 2: [[], [2, 8, 32]],
    4: [[], [1, 4, 16]],
    8: [[], [8]],
    16: [[], [1, 16]],
    32: [[], [32]],
}

/**
 * 根据规则计算权限列表
 * @param access 权限列表
 * @param check 选中权限
 * @param unCheck 取消选中权限
 * @returns
 */
const getAccessByRule = (
    access: number[],
    check: number[],
    unCheck: number[],
) => {
    const filterAccess = access.filter((o) => !unCheck.includes(o))
    return filterAccess.concat(check)
}

export const ruleValidate = (
    access: number[],
    isCheck: boolean,
    value: number,
) => {
    const [checked, unChecked] = isCheck
        ? CheckRules[value]
        : UnCheckRules[value]
    // 勾选导致的连带取消勾选操作
    if (isCheck) {
        // 具有连带取消操作的key值
        const keys = Object.keys(UnCheckRules).filter(
            (o) => UnCheckRules[o][1].length > 1,
        )
        // 已勾选的key
        const accessKeys = access.filter((o) => keys.includes(`${o}`))
        const elseUnChecked = []
        // 需要取消的key
        unChecked.forEach((k) => {
            if (accessKeys.includes(k)) {
                elseUnChecked.concat(UnCheckRules[k][1])
            }
        })
        unChecked.concat(elseUnChecked)
    }

    const arr = getAccessByRule(access, checked, unChecked)

    return Array.from(new Set(arr))
}

/** 授权权限  互斥 */
const AuthKeys = [OptType.Auth, OptType.Allocate]

/**
 * 获取权限列表
 */
export const getAccessOptions = (
    accessList: { label: string; value: OptType }[],
    hiddenDeny?: boolean,
) => {
    const options: any[] = []
    // 分离基础权限和授权权限
    const basePermissions = accessList.filter(
        (item) => !AuthKeys.includes(item.value),
    )
    const authPermissions = accessList.filter((item) =>
        AuthKeys.includes(item.value),
    )

    // 基础权限 + 授权权限组合
    basePermissions.forEach((baseComb, index) => {
        const curOpts = basePermissions.slice(0, index + 1)

        const baseItem = {
            label: curOpts.map((p: any) => p.label).join('/'),
            value: curOpts.reduce((p: any, c: any) => {
                const val = AccessOptMap[`${c.value}-${AccessType.Allow}`]
                // eslint-disable-next-line no-bitwise
                return p ? p | val : val
            }, 0),
        }

        options.push(baseItem)

        authPermissions.forEach((authPerm) => {
            const it = {
                label: `${baseItem.label}/${authPerm.label}`,
                value:
                    // eslint-disable-next-line no-bitwise
                    baseItem.value |
                    AccessOptMap[`${authPerm.value}-${AccessType.Allow}`],
            }
            options.push(it)
        })
    })

    //  纯授权权限（授权、授权仅分配）
    options.push(
        ...authPermissions.map((o) => ({
            label: o.label,
            value: AccessOptMap[`${o.value}-${AccessType.Allow}`],
        })),
    )
    // if (!hiddenDeny) {
    //     const rejectItem = {
    //         label: `${__('拒绝')}${cur.label}`,
    //         value: AccessOptMap[`${cur.value}-${AccessType.Deny}`],
    //     }
    //     arr.push(rejectItem)
    // }
    return options
}

export interface IPermission {
    action: OptType | string
    effect: AccessType | string
}

/** 中文拼音排序方法 */
export const zhCnCompare = (a, b) => {
    return a.localeCompare(b, 'zh')
}

// 顺序：读取、下载、授权、授权(仅分配)
const PermissionOrder = [
    OptType.Read,
    OptType.Download,
    OptType.Auth,
    OptType.Allocate,
].map((o) => AccessOptsList.find((p: any) => p.value === o)?.label)

/** 按照权限类型预定义顺序排序 */
export const permissionOrderCompare = (a: string, b: string) => {
    const order = PermissionOrder
    const indexA = order.indexOf(a)
    const indexB = order.indexOf(b)

    // 如果都在预定义顺序中，按照预定义顺序排序
    if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
    }

    // 如果只有一个在预定义顺序中，预定义的排在前面
    if (indexA !== -1) return -1
    if (indexB !== -1) return 1

    // 如果都不在预定义顺序中，使用中文拼音排序
    return zhCnCompare(a, b)
}

/**
 * 根据权限列表计算标签
 */
export const getLabelByPermission = (permissionValues?: number[]) => {
    const allowArr: any[] = []
    const denyArr: any[] = []

    ;(permissionValues || []).forEach((item: number) => {
        const keyStr =
            Object.keys(AccessOptMap)?.[
                Object.values(AccessOptMap).indexOf(item)
            ]

        const [action, effect] = (keyStr || '').split('-')

        const label =
            AccessOptsList.find((o) => o.value === action)?.label ?? '--'
        if (effect === AccessType.Allow) {
            allowArr.push(label)
        } else {
            denyArr.push(label)
        }
    })
    const labelAllow = allowArr.sort(permissionOrderCompare).join('/')
    const labelDeny = denyArr.sort(permissionOrderCompare).join('/')

    return `${labelAllow}${
        labelDeny
            ? `${labelAllow ? '/' : ''}${__('拒绝')}${
                  denyArr?.length === 1 ? labelDeny : `(${labelDeny})`
              }`
            : ''
    }`
}

export const getPermissionLabel = (arr: any[]) => {
    if (!arr?.length) return '--'
    const optAccess = (arr ?? []).map(
        (o) => AccessOptMap[`${o.action}-${o.effect}`],
    )
    return getLabelByPermission(optAccess)
}
