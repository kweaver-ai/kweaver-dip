import { noop } from 'lodash'
import { createContext, useContext } from 'react'

interface ISelectAttrProviderContext {
    allOptions: Array<any>
    setAllOptions: (options: Array<any>) => void
    allAttributes: Array<any>
}
// 初始化组件通信
const SelectAttrContext = createContext<ISelectAttrProviderContext>({
    allOptions: [],
    setAllOptions: noop,
    allAttributes: [],
})
// 获取context的方法
const useSelectAttrContext = () =>
    useContext<ISelectAttrProviderContext>(SelectAttrContext)

// 提供context的组件
const SelectAttrProvider = SelectAttrContext.Provider

export { useSelectAttrContext, SelectAttrProvider }
