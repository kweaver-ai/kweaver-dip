// import { useEffect, useMemo, useState } from 'react'
// import { useLocation } from 'react-router-dom'
// import { IRole, formatError, getCurUserRoles } from '@/core'

// let globalUserRole

// export const useUserRole = (): [
//     Array<IRole> | undefined,
//     () => Promise<void>,
// ] => {
//     const [roleList, setRoleList] = useState<Array<IRole> | undefined>(
//         globalUserRole,
//     )

//     // 获取当前用户角色
//     const getUserInfo = async () => {
//         try {
//             const res = await getCurUserRoles()
//             setRoleList(res || [])
//             globalUserRole = res || []
//         } catch (error) {
//             formatError(error)
//         }
//     }

//     useEffect(() => {
//         if (!globalUserRole) {
//             getUserInfo()
//         }
//     }, [])

//     return [useMemo(() => roleList, [roleList]), getUserInfo]
// }
