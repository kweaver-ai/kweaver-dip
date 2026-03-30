export enum NodeTypes {
    data_asset = 'data_asset',
    business_obj = 'business_obj',
    owner = 'owner',
    department = 'department',
    info_system = 'system',
    asset_tag = 'asset_tag',
    data_source = 'data_source',
    schema = 'schema',
    catalog = 'catalog',
    api = 'api',
    data_view = 'data_view',
}

export const NodeInfo = {
    [NodeTypes.data_asset]: {
        label: '数据资源',
        color: 'rgba(58, 143, 240, 1)',
        containerColor: 'rgba(184, 224, 255, 0.25)',
    },
    [NodeTypes.business_obj]: {
        label: '业务对象',
        color: 'rgba(110, 196, 114, 1)',
        containerColor: 'rgba(110, 196, 114, 0.1',
    },
    [NodeTypes.owner]: {
        label: '数据Owner',
        color: 'rgba(218, 72, 71, 1)',
        containerColor: 'rgba(218, 72, 71, 0.1)',
    },
    [NodeTypes.department]: {
        label: '所属部门',
        color: 'rgba(15, 166, 219, 1)',
        containerColor: 'rgba(15, 166, 219, 0.15)',
    },
    [NodeTypes.info_system]: {
        label: '信息系统',
        color: 'rgba(224, 134, 59, 1)',
        containerColor: 'rgba(224, 134, 59, 0.1)',
    },
    [NodeTypes.asset_tag]: {
        label: '资源标签',
        color: 'rgba(72, 214, 183, 1)',
        containerColor: 'rgba(72, 214, 183, 0.1)',
    },
    [NodeTypes.data_source]: {
        label: '数据源',
        color: 'rgba(111, 193, 52, 1)',
        containerColor: 'rgba(111, 193, 52, 0.1)',
    },
    [NodeTypes.schema]: {
        label: 'Schema',
        color: 'rgba(197, 156, 244, 1)',
        containerColor: 'rgba(197, 156, 244, 0.1)',
    },
    [NodeTypes.catalog]: {
        label: '目录',
        color: 'rgba(255, 186, 48, 1)',
        containerColor: 'rgba(255, 186, 48, 0.1)',
    },
    [NodeTypes.api]: {
        label: '接口',
        color: 'rgba(255, 186, 48, 1)',
        containerColor: 'rgba(255, 186, 48, 0.1)',
    },
    [NodeTypes.data_view]: {
        label: '数据库表',
        color: 'rgba(20, 206, 170, 1)',
        containerColor: 'rgba(20, 206, 170, 0.1)',
    },
}
// 接口服务收起时展示个数-一行最大3个，展示三行后显示展开按钮
export const ApiServicesDisplayMaxCount = 12
