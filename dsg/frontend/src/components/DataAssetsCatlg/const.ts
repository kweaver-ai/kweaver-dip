import __ from './locale'

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

export enum CatlgView {
    // 业务视角
    BUSIN = 'busin',
    // 数据视角
    DATA = 'data',
}

export const catlgViewOptions = [
    { label: __('业务视角'), value: CatlgView.BUSIN },
    { label: __('数据视角'), value: CatlgView.DATA },
]

// 数据资源目录排序参数枚举
export enum IDataCatlgSortType {
    UPDATESORTER = 'updated_at',
    DATACOLUMNSORTER = 'table_rows',
    PUBLISHEDSORTER = 'published_at',
    ONLINEAT = 'online_at',
    // 目录更新时间
    UPDATETIME = 'updated_at',
    // 数据更新时间
    DATAUPDATETIME = 'data_updated_at',
    // 申请量
    APPLYNUM = 'apply_num',
}

export const catlgSortOptions = [
    { label: __('目录更新时间'), value: IDataCatlgSortType.UPDATETIME },
    // { label: __('申请量'), value: IDataCatlgSortType.APPLYNUM },
    // { label: __('数据更新时间'), value: IDataCatlgSortType.DATAUPDATETIME },
]

export const unCategorizedObj = {
    id: '00000000-0000-0000-0000-000000000001',
    name: __('其他'),
}
