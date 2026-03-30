// import { useEffect, useMemo, useState } from 'react'
// import { useLocation } from 'react-router-dom'
// import { IUserRoleInfo, formatError, getCurUserRoles } from '@/core'

// let globalRoles: IUserRoleInfo[] | undefined

// export const useUserRoles = (): [
//     IUserRoleInfo[] | undefined,
//     () => Promise<void>,
// ] => {
//     const [roles, setRoles] = useState<IUserRoleInfo[] | undefined>(globalRoles)

//     const getRoles = async () => {
//         try {
//             const res = await getCurUserRoles()
//             setRoles(res)
//             globalRoles = res
//         } catch (err) {
//             formatError(err)
//         }
//     }
//     useEffect(() => {
//         if (globalRoles === undefined) {
//             getRoles()
//         }
//     }, [])

//     return [useMemo(() => roles, [roles]), getRoles]
// }
