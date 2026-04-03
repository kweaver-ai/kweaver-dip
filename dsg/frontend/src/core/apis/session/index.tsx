import requests from '@/utils/request'

const { get, post } = requests

export interface IUserParentDep {
    path_id: string
    path: string
}

export interface IUserInfo {
    Account: string
    Authenticated: boolean
    CsfLevel: number
    Email: string
    Frozen: boolean
    ID: string
    Roles: any
    Telephone: string
    ThirdAttr: string
    ThirdID: string
    UserType: number
    VisionName: string
    Groups: any[] | null
    ParentDeps: IUserParentDep[]
}

interface INewUserDirectDep {
    depid?: string
    name?: string
}

interface INewUserRoleInfo {
    id?: string
    name?: string
}

interface INewUserInfoResponse {
    account?: string
    agreedtotermsofuse?: boolean
    csflevel?: number
    csflevel2?: number
    csflevel2_name?: string
    csflevel_name?: string
    directdepinfos?: INewUserDirectDep[] | null
    freezestatus?: boolean
    ismanager?: boolean
    leakproofvalue?: number
    mail?: string
    name?: string
    needrealnameauth?: boolean
    needsecondauth?: boolean
    pwdcontrol?: number
    roleinfos?: INewUserRoleInfo[]
    roletypes?: string[]
    telnumber?: string
    type?: string
    userid?: string
    usertype?: number
}

const normalizeValue = (value?: string) => value?.trim() || ''

const formatParentDeps = (
    directdepinfos?: INewUserDirectDep[] | null,
): IUserParentDep[] => {
    const validDeps = (directdepinfos || []).reduce<
        Array<{ depid: string; name: string }>
    >((acc, item) => {
        const depid = normalizeValue(item?.depid)
        const name = normalizeValue(item?.name)

        if (!depid && !name) {
            return acc
        }

        const prev = acc[acc.length - 1]
        if (prev && prev.depid === depid && prev.name === name) {
            return acc
        }

        const duplicate = acc.some(
            (dep) => dep.depid === depid && dep.name === name,
        )
        if (duplicate) {
            return acc
        }

        acc.push({ depid, name })
        return acc
    }, [])

    if (!validDeps.length) {
        return []
    }

    const pathIds = validDeps.map((item) => item.depid).filter(Boolean)
    const pathNames = validDeps.map((item) => item.name).filter(Boolean)

    return [
        {
            // 按“数组第一个是顶层、最后一个是底层”拼接路径，
            // 过滤空项并去重后，保持 split('/').pop() 仍然取到最后一级有效组织 ID。
            path_id: pathIds.join('/'),
            path: pathNames.join('/'),
        },
    ]
}

const transformUserInfo = (data: INewUserInfoResponse): IUserInfo => {
    return {
        Account: data?.account || '',
        Authenticated: !!data?.userid,
        CsfLevel: data?.csflevel ?? 0,
        Email: data?.mail || '',
        Frozen: !!data?.freezestatus,
        ID: data?.userid || '',
        Roles: data?.roleinfos || [],
        Telephone: data?.telnumber || '',
        ThirdAttr: '',
        ThirdID: '',
        UserType: data?.usertype ?? 0,
        VisionName: data?.name || data?.account || '',
        Groups: null,
        ParentDeps: formatParentDeps(data?.directdepinfos),
    }
}

export interface IRole {
    id: string
    name: string
    color?: string
    icon?: string
    status?: number
    system?: number
    created_at?: string
    updated_at?: string
}

/**
 * 刷新令牌
 */
export const refreshToken = () => {
    return get(`/af/api/session/v1/refresh-token`)
}

// 获取用户信息
export const getUserInfo = () => {
    return get(`/api/eacp/v1/user/get`).then(transformUserInfo)
}

/*
 * 单点登录
 * @code AS TOKEN
 */
export const sso = (parms: { code: string }) => {
    return post(`/af/api/session/v1/sso`, parms)
}

/**
 * 单点登录 -- get请求
 * @param url参数或者对象参数
 */
export const ssoGet = (parms: any) => {
    if (typeof parms === 'string') {
        return get(`/af/api/session/v1/sso${parms}`)
    }
    return get(`/af/api/session/v1/sso`, parms)
}
/**
 * 获取登录配置
 * @param
 */
export const loginConfigs = () => {
    return get(`/api/eacp/v1/auth1/login-configs`)
}

/**
 * 登出
 * @returns
 */
export const logout = () => {
    return get('/af/api/session/v1/logout')
}
