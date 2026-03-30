import actionType from './actionType'

const defaultState = {
    architectureData: {
        treeData: [],
        selectedNode: undefined,
    },
    dataAssetsData: {
        dataAssetIds: [],
    },
    dataProductData: {
        dataProductIds: [],
    },
    citySharingData: { data: [], open: false, inCogAsstOpen: false },
}

const defaultIndicatorManageTabIndex = 'all'
const agentState = {}

// 定义reducer 更改store中的数据
export const architectureReducer = (state, action) => {
    switch (action.type) {
        case actionType.GET_BUSARCHITECTURE_DATA:
            return action.payload || state
        default:
            return defaultState.architectureData
    }
}

export const dataAssetsReducer = (state, action) => {
    switch (action.type) {
        case actionType.SET_DATA_ASSETS:
            return action.payload || state

        default:
            return defaultState.dataAssetsData
    }
}

export const dataProductReducer = (state, action) => {
    switch (action.type) {
        case actionType.SET_DATA_PRODUCT:
            return action.payload || state

        default:
            return defaultState.dataProductData
    }
}

export const IndicatorManageReducer = (state, action) => {
    switch (action.type) {
        case actionType.INDICATORMANAGE_LIST_TAB_INDEX:
            return action.payload
        default:
            return defaultIndicatorManageTabIndex
    }
}

export const AgentManagerReducer = (state, action) => {
    switch (action.type) {
        case actionType.AGENT_MANAGE_DATA:
            return action.payload || state
        default:
            return agentState
    }
}

/**
 * 市州共享
 */
export const citySharingReducer = (state, action) => {
    switch (action.type) {
        case actionType.CITY_SHARING:
            return action.payload || state
        case actionType.OPEN_SHARELIST:
            return action.payload || state
        default:
            return defaultState.citySharingData
    }
}

const defaultMenusCountConfigs = []

export const menusCountConfigsReducer = (state, action) => {
    const currentState = state ?? defaultMenusCountConfigs

    switch (action?.type) {
        case actionType.SET_MENUS_COUNT_CONFIGS:
            return Array.isArray(action.payload)
                ? action.payload
                : defaultMenusCountConfigs
        default:
            return currentState
    }
}
