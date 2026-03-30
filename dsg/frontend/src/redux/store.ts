import { createStore, combineReducers } from 'redux'
import {
    architectureReducer,
    dataAssetsReducer,
    IndicatorManageReducer,
    dataProductReducer,
    AgentManagerReducer,
    citySharingReducer,
    menusCountConfigsReducer,
} from './reducer'

const store = createStore(
    combineReducers({
        architectureReducer,
        dataAssetsReducer,
        IndicatorManageReducer,
        dataProductReducer,
        AgentManagerReducer,
        citySharingReducer,
        menusCountConfigsReducer,
    }),
)
export default store
