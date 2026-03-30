import { noop } from 'lodash'
import { createContext, useContext } from 'react'

// 模型管理上下文
interface IArchitectureProvider {
    selectedDepartmentId: string
}

// 模型管理上下文
const ArchitectureContext = createContext<IArchitectureProvider>({
    selectedDepartmentId: '',
})

// 使用模型管理上下文
export const useArchitecture = () => useContext(ArchitectureContext)

// 模型管理提供者
export const ArchitectureProvider = ArchitectureContext.Provider
