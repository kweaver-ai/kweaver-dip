import { IChatDetails } from '@/core'
import { IBusinessAssetsFilterQuery } from '../DataAssetsCatlg/helper'

/**
 * 资源类型
 * @param ALL   全部
 * @param DATACATLG    数据目录
 * @param LOGICVIEW    库表
 * @param INTERFACESVC  服务接口
 */
export enum AssetType {
    ALL = 'all',
    DATACATLG = 'data_catalog',
    LOGICVIEW = 'data_view',
    INTERFACESVC = 'interface_svc',
    INDICATOR = 'indicator',
}

/**
 * 资源类型
 * @param ALL   全部
 * @param DATARESOURCE    数据资源
 * @param DATACATLG    数据目录
 */
export enum AssetVersion {
    DATARESOURCE = 'data-resource',
    DATACATLG = 'data-catalog',
}

/**
 * 搜索类型
 * @param OBJ  智能搜索对象
 * @param DIM  智能搜索维度
 */
export enum KEYTYPE {
    OBJ = 'obj',
    DIM = 'dim',
}

/**
 * 筛选项
 * @param name  名称
 * @param count  数量
 * @param class_name  实体分类名
 * @param children  子集
 */
export type IFilterItem = {
    name: string
    count?: number
    class_name?: string
    children?: IFilterItem[]
}

// 初始化数据
export const InitData = {
    [KEYTYPE.OBJ]: [],
    [KEYTYPE.DIM]: [],
}

/**
 * 数据目录操作
 * @param DATADOWNLOAD 数据下载
 * @param ADDTOREQUIRELIST 添加到需求清单
 * @param APPLYNOW 立即申请
 */
export enum BusinObjOpr {
    DATADOWNLOAD = 'dataDownload',
    ADDTOREQUIRELIST = 'addToReuqireList',
    APPLYNOW = 'applyNow',
}

export const businessAssetsFilterInit: IBusinessAssetsFilterQuery = {
    // keyword: '',
    data_kind: [],
    shared_type: [],
    size: 20,
    update_cycle: [],
}

// 收藏状态
export const enum FavoriteAction {
    // 收藏
    Favorite = 'favorite',

    // 取消收藏
    CancelFavorite = 'cancel-favorite',
}
