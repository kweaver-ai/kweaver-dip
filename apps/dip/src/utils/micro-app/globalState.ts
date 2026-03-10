import { useLanguageStore } from '@/stores/languageStore'
import shallowEqual from '../handle-function/ShallowEqual'

/**
 * 允许微应用更新的字段类型
 * 使用类型约束确保类型安全
 */
type AllowedField = 'breadcrumb'

/** 全局状态允许更新的字段 */
const allowedFields: AllowedField[] = ['breadcrumb']

/** 面包屑项接口 */
export interface BreadcrumbItem {
  key?: string
  name: string
  path?: string
  icon?: string
  disabled?: boolean
}

/**
 * 微应用全局状态
 *
 * 约定：
 * - 主应用统一管理全局状态的结构
 * - 微应用通过 props.setMicroAppState 更新全局状态, 支持更新 allowedFields 中的字段
 * - 主应用通过 onMicroAppGlobalStateChange 监听全局状态的变化并更新 UI
 * - 微应用信息存储在 microAppStore 中，不在此状态中
 */
export interface MicroAppGlobalState {
  /** 当前语言，如 zh-CN / en-US（仅主应用可更新，初始化时从 languageStore 读取） */
  language: string
  /** 面包屑导航数据（微应用可更新） */
  breadcrumb?: Array<BreadcrumbItem>
  /** Copilot 相关状态（仅主应用可更新，用于通知微应用 Copilot 事件） */
  copilot?: {
    /** Copilot 最近一次点击时间戳 */
    clickedAt?: number
    [key: string]: any
  }
  /** 预留扩展字段 */
  [key: string]: any
}

/**
 * 状态变化监听器类型
 */
type StateChangeListener = (state: MicroAppGlobalState, prev: MicroAppGlobalState) => void

/**
 * 全局状态存储
 * 使用自定义实现替代 qiankun 的 globalState（qiankun 3.0 将移除）
 */
class MicroAppStateManager {
  private state: MicroAppGlobalState
  private listeners: Set<StateChangeListener> = new Set()
  /** 最大监听器数量限制，防止内存泄漏 */
  private static readonly MAX_LISTENERS = 50
  /** 是否启用调试模式（开发环境） */
  private readonly debug: boolean

  constructor(initialState: MicroAppGlobalState) {
    this.state = { ...initialState }
    this.debug = process.env.NODE_ENV === 'development'
  }

  /**
   * 获取当前状态
   */
  getState(): MicroAppGlobalState {
    return { ...this.state }
  }

  /**
   * 设置全局状态
   */
  setState(patch: Partial<MicroAppGlobalState>, options?: { allowAllFields?: boolean }): boolean {
    const prevState = { ...this.state }

    // 如果 allowAllFields 为 true（主应用调用），允许更新所有字段
    if (options?.allowAllFields) {
      this.state = { ...this.state, ...patch }

      // 调试模式：记录状态更新
      if (this.debug) {
        console.log('[微应用全局状态] 主应用更新状态:', {
          更新前: prevState,
          更新内容: patch,
          更新后: this.state,
        })
      }
    } else {
      // 否则（微应用调用），只允许更新 allowedFields 中的字段
      const filteredPatch: Partial<MicroAppGlobalState> = {}
      const rejectedFields: string[] = []

      // 收集允许的字段
      allowedFields.forEach((field) => {
        if (field in patch) {
          filteredPatch[field as keyof MicroAppGlobalState] =
            patch[field as keyof MicroAppGlobalState]
        }
      })

      // 收集被拒绝的字段（开发环境）
      Object.keys(patch).forEach((key) => {
        if (!allowedFields.includes(key as AllowedField)) {
          rejectedFields.push(key)
        }
      })

      // 开发环境：警告被拒绝的字段
      if (rejectedFields.length > 0 && this.debug) {
        console.log(
          '[微应用全局状态] 以下字段被过滤（微应用无权修改）:',
          rejectedFields,
          '\n允许的字段:',
          allowedFields,
        )
      }

      // 如果过滤后没有有效字段，直接返回，不更新状态
      if (Object.keys(filteredPatch).length === 0) {
        if (this.debug) {
          console.log('[微应用全局状态] 没有有效字段可更新，更新被忽略')
        }
        return false
      }

      this.state = { ...this.state, ...filteredPatch }

      // 调试模式：记录状态更新
      if (this.debug) {
        console.log('[微应用全局状态] 微应用更新状态:', {
          更新前: prevState,
          更新内容: filteredPatch,
          被过滤的字段: rejectedFields,
          更新后: this.state,
        })
      }
    }

    // 浅比较：如果状态没有实际变化，不通知监听器
    if (shallowEqual(this.state, prevState)) {
      if (this.debug) {
        console.log('[微应用全局状态] 状态未变化（浅比较），跳过通知监听器')
      }
      return false
    }

    // 通知所有监听器
    this.notifyListeners(this.state, prevState)
    return true
  }

  /**
   * 监听全局状态变化
   * 支持多个监听器同时监听，每个监听器独立管理
   */
  onGlobalStateChange(callback: StateChangeListener, fireImmediately?: boolean): () => void {
    // 检查监听器数量限制
    if (this.listeners.size >= MicroAppStateManager.MAX_LISTENERS) {
      const errorMsg = `[微应用全局状态] 监听器数量已达上限（${MicroAppStateManager.MAX_LISTENERS}），请检查是否有内存泄漏`
      console.log(errorMsg)
      if (this.debug) {
        console.log('当前监听器数量:', this.listeners.size)
        console.log('监听器列表:', Array.from(this.listeners))
      }
      // 返回空函数，避免报错
      return () => {}
    }

    // 添加监听器（允许多个监听器同时存在）
    this.listeners.add(callback)

    // 调试模式：记录监听器注册
    if (this.debug) {
      console.log(`[微应用全局状态] 注册监听器，当前监听器数量: ${this.listeners.size}`)
    }

    // 如果 fireImmediately 为 true，立即触发一次
    if (fireImmediately) {
      const currentState = this.getState()
      callback(currentState, currentState)
    }

    // 返回取消监听的函数
    return () => {
      this.listeners.delete(callback)
      if (this.debug) {
        console.log(`[微应用全局状态] 移除监听器，当前监听器数量: ${this.listeners.size}`)
      }
    }
  }

  /**
   * 取消所有监听
   */
  offGlobalStateChange(): boolean {
    this.listeners.clear()
    return true
  }

  /**
   * 通知所有监听器状态变化
   */
  private notifyListeners(state: MicroAppGlobalState, prev: MicroAppGlobalState): void {
    // 调试模式：记录通知信息
    if (this.debug) {
      const changedFields = Object.keys(state).filter((key) => state[key] !== prev[key])
      if (changedFields.length > 0) {
        console.log(
          `[微应用全局状态] 通知 ${this.listeners.size} 个监听器，变化字段:`,
          changedFields,
        )
      }
    }

    this.listeners.forEach((listener, index) => {
      try {
        listener(state, prev)
      } catch (error) {
        console.log(`[微应用全局状态] 监听器 ${index} 执行出错:`, error, '\n监听器函数:', listener)
      }
    })
  }
}

/**
 * 获取初始状态
 * 从 languageStore 中读取语言设置，支持动态初始化
 *
 * 注意：languageStore 使用 persist 中间件，会从 localStorage 恢复状态
 * 如果获取失败，使用默认值 'zh-CN'
 */
function getInitialState(): MicroAppGlobalState {
  let lang = 'zh-CN'

  try {
    const languageState = useLanguageStore.getState()
    if (languageState?.language) {
      lang = languageState.language
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[微应用全局状态] 无法从 languageStore 获取语言，使用默认值 zh-CN:', error)
    }
  }

  return {
    language: lang,
    breadcrumb: [],
  }
}

// 初始化全局状态管理器（使用动态初始状态）
const stateManager = new MicroAppStateManager(getInitialState())

/**
 * 设置全局状态
 *
 * 约定：
 * - 微应用只能更新 allowedFields 中允许的字段（如 breadcrumb）
 * - 主应用可以更新所有字段（如 lang、userId）
 * - 如果 patch 中包含非 allowedFields 的字段，会被过滤掉（仅当从微应用调用时）
 */
export const setMicroAppGlobalState = (
  patch: Partial<MicroAppGlobalState>,
  options?: { allowAllFields?: boolean },
): boolean => {
  return stateManager.setState(patch, options)
}

/**
 * 监听全局状态变化
 */
export const onMicroAppGlobalStateChange = (
  callback: (state: MicroAppGlobalState, prev: MicroAppGlobalState) => void,
  fireImmediately?: boolean,
): (() => void) => {
  return stateManager.onGlobalStateChange(callback, fireImmediately)
}

/**
 * 取消监听全局状态变化
 */
export const offMicroAppGlobalStateChange = (): boolean => {
  return stateManager.offGlobalStateChange()
}

/**
 * 获取当前全局状态（用于调试或特殊场景）
 */
export const getMicroAppGlobalState = (): MicroAppGlobalState => {
  return stateManager.getState()
}

export default {
  setMicroAppGlobalState,
  onMicroAppGlobalStateChange,
  offMicroAppGlobalStateChange,
  getMicroAppGlobalState,
}
