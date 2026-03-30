import React, { createContext, useReducer, useMemo, ReactNode } from 'react'

import { fromJS } from 'immutable'

// context
export const CustomViewContext = createContext<any>({})

// 相当于之前的 constants
export const CHANGE_DATA_VIEWS_LISTS = 'customView/CHANGE_DATA_VIEWS_LISTS'
export const CHANGE_TAB_ITEMS = 'customView/CHANGE_TAB_ITEMS'
export const CHANGE_TAB_ACTIVE_KEY = 'customView/CHANGE_TAB_ACTIVE_KEY'
export const CHANGE_SQL_INFO = 'customView/CHANGE_SQL_INFO'
export const CHANGE_SQL_TEXT = 'customView/CHANGE_SQL_TEXT'
export const CHANGE_SQL_RESULT_FULL_SCREEN =
    'customView/CHANGE_SQL_RESULT_FULL_SCREEN'
export const CHANGE_DATA_VIEWS_LISTS_REMOVE_ID =
    'customView/CHANGE_DATA_VIEWS_LISTS_REMOVE_ID'

// reducer 纯函数
const reducer = (state: any, action: any) => {
    switch (action.type) {
        case CHANGE_DATA_VIEWS_LISTS:
            return state.set('dataViewLists', action.data)
        case CHANGE_TAB_ITEMS:
            return state.set('tabItems', action.data)
        case CHANGE_TAB_ACTIVE_KEY:
            return state.set('activeKey', action.data)
        case CHANGE_SQL_INFO:
            return state.set('sqlInfo', action.data)
        case CHANGE_SQL_TEXT:
            return state.set('sqlText', action.data)
        case CHANGE_SQL_RESULT_FULL_SCREEN:
            return state.set('sqlResultFullScreen', action.data)
        case CHANGE_DATA_VIEWS_LISTS_REMOVE_ID:
            return state.set('dataViewRemoveId', action.data)
        default:
            return state
    }
}

// Provider 组件
export const CustomViewReduxWrapper = ({
    children,
}: {
    children: ReactNode
}) => {
    // useReducer 的第二个参数中传入初始值
    const [data, dispatch] = useReducer(
        reducer,
        fromJS({
            dataViewLists: [],
            tabItems: [],
            activeKey: 'canvas',
            sqlInfo: {
                flag: false,
                text: '',
            },
            sqlResultFullScreen: false,
            sqlText: '',
            dataViewRemoveId: '',
        }),
    )

    return (
        // eslint-disable-next-line
        <CustomViewContext.Provider value={{ data, dispatch }}>
            {children}
        </CustomViewContext.Provider>
    )
}
