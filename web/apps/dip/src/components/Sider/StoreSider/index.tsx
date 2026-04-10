// import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
// import { Tooltip } from 'antd'
// import clsx from 'clsx'
// import { useCallback, useMemo } from 'react'
// import { useLocation, useNavigate } from 'react-router-dom'
// import { getFirstVisibleRouteByModule, getRouteByPath } from '@/routes/utils'
// import { StoreMenuSection } from '../components/StoreMenuSection'

// interface StoreSiderProps {
//   /** 是否折叠 */
//   collapsed: boolean
//   /** 折叠状态改变回调 */
//   onCollapse: (collapsed: boolean) => void
// }

// /**
//  * 商店版块通用的侧边栏（StoreSider）
//  * 用于 store 类型的侧边栏
//  */
// const StoreSider = ({ collapsed, onCollapse }: StoreSiderProps) => {
//   const navigate = useNavigate()
//   const location = useLocation()

//   // TODO: 角色信息需要从其他地方获取，暂时使用空数组
//   const roleIds = useMemo(() => new Set<string>([]), [])
//   const firstVisibleRoute = useMemo(
//     () => getFirstVisibleRouteByModule('store', roleIds),
//     [roleIds],
//   )

//   // 根据当前路由确定选中的菜单项
//   const getSelectedKey = useCallback(() => {
//     const pathname = location.pathname
//     if (pathname === '/') {
//       return firstVisibleRoute?.key || 'my-app'
//     }

//     // 检查是否是应用路由（/application/:appKey）
//     const appMatch = pathname.match(/^\/application\/([^/]+)/)
//     if (appMatch) {
//       return `micro-app-${appMatch[1]}`
//     }

//     const route = getRouteByPath(pathname)
//     return route?.key || 'my-app'
//   }, [location.pathname, firstVisibleRoute])

//   const selectedKey = getSelectedKey()

//   return (
//     <div className="flex flex-col h-full px-0 pt-4 pb-2 overflow-hidden min-h-0">
//       {/* 菜单内容：min-h-0 保证 flex 子项正确收缩，避免撑开导致底部块位移引发 CLS */}
//       <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dip-hideScrollbar">
//         <StoreMenuSection
//           collapsed={collapsed}
//           selectedKey={selectedKey}
//           roleIds={roleIds}
//           navigate={navigate}
//         />
//       </div>

//       {/* 底部块固定占位，避免菜单渲染后挤压导致 CLS */}
//       <div className="shrink-0">
//         <div className="h-px bg-[--dip-border-color] my-2 shrink-0" />
//         <div
//           className={clsx(
//             'flex items-center min-h-8',
//             collapsed ? 'justify-center' : 'justify-between pl-2 pr-2',
//           )}
//         >
//           <Tooltip title={collapsed ? '展开' : '收起'} placement="right">
//             <button
//               type="button"
//               className="text-sm cursor-pointer flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color] hover:text-[--dip-primary-color]"
//               onClick={() => onCollapse(!collapsed)}
//             >
//               {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//             </button>
//           </Tooltip>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default StoreSider
