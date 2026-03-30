import { useState, useEffect, useCallback } from 'react'
import { useCurrentUser } from './useCurrentUser'

/**
 * 自定义Hook，用于获取和设置localStorage中的键值对
 * @param key - localStorage中的键名
 * @param initialValue - 初始值，当localStorage中不存在该键时使用
 * @returns - 返回一个数组，包含当前值和设置新值的函数
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // 创建一个状态，用于存储当前值
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            // 尝试从localStorage中获取值
            const item = localStorage.getItem(key)
            // 如果存在返回解析后的值，否则返回初始值
            return item ? JSON.parse(item) : initialValue
        } catch (error) {
            // 如果发生错误（例如JSON解析错误），返回初始值
            return initialValue
        }
    })

    // 更新localStorage中的值并更新状态
    const setValue = useCallback(
        (value: T | ((val: T) => T)) => {
            try {
                // 允许像useState一样传入函数
                const valueToStore =
                    value instanceof Function ? value(storedValue) : value

                // 更新状态
                setStoredValue(valueToStore)

                // 更新localStorage
                localStorage.setItem(key, JSON.stringify(valueToStore))
            } catch (error) {
                // console.error(`Error setting localStorage key "${key}":`, error)
            }
        },
        [key, storedValue],
    )

    // 当key变化时更新状态（这在实际使用中可能很少发生）
    useEffect(() => {
        try {
            const item = localStorage.getItem(key)
            setStoredValue(item ? JSON.parse(item) : initialValue)
        } catch (error) {
            setStoredValue(initialValue)
        }
    }, [key, initialValue])

    return [storedValue, setValue] as const
}

/**
 * 特定用于处理用户ID相关的localStorage存储
 * @param key - localStorage中的键名
 * @param initialValue - 初始值，当localStorage中不存在该键时使用
 * @returns - 返回一个数组，包含当前值(T)和设置值的函数
 */
export function useUserLocalStorage<T>(key: string, initialValue: T) {
    // 获取当前用户信息
    const [userInfo] = useCurrentUser()
    // 创建状态存储当前值
    const [value, setValue] = useState<T>(() => {
        try {
            const item = localStorage.getItem(key)
            if (item === null) {
                return initialValue
            }
            const parsedItem = JSON.parse(item)
            return parsedItem ? parsedItem[userInfo?.ID] : initialValue
        } catch (error) {
            return initialValue
        }
    })

    // 更新localStorage中用户相关的值
    const updateValue = useCallback(
        (newValue: T | ((val: T) => T)) => {
            try {
                let storageData = {}

                // 检查是否已存在数据
                const existingData = localStorage.getItem(key)
                if (existingData !== null) {
                    storageData = JSON.parse(existingData)
                }

                // 更新用户数据
                const updatedData = {
                    ...storageData,
                    [userInfo?.ID]: newValue,
                }

                // 保存到localStorage
                localStorage.setItem(key, JSON.stringify(updatedData))

                // 更新状态
                setValue(newValue)
            } catch (error) {
                // console.error(
                //     `Error setting user localStorage key "${key}":`,
                //     error,
                // )
            }
        },
        [key, userInfo?.ID],
    )

    return [value, updateValue] as const
}
