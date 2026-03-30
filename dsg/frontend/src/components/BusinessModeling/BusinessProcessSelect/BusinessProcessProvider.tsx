import { noop } from 'lodash'
import { createContext, useContext } from 'react'

interface IBusinessProcessProviderContext {
    allOptions
    setAllOptions
}
// 初始化组件通信
const BusinessProcessContext = createContext<IBusinessProcessProviderContext>({
    allOptions: [],
    setAllOptions: noop,
})
// 获取context的方法
const useBusinessProcessContext = () =>
    useContext<IBusinessProcessProviderContext>(BusinessProcessContext)

// 提供context的组件
const BusinessProcessProvider = BusinessProcessContext.Provider

export { useBusinessProcessContext, BusinessProcessProvider }
