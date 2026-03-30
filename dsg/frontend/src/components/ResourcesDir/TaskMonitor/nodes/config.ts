import { NodeDataType } from '../const'

// 节点类型枚举
export enum NodeType {
    Catalog = 'catalog-node',
    Task = 'task-node',
    Tag = 'tag-node',
}

// 节点配置常量
export const NodeConfig = {
    [NodeType.Catalog]: {
        width: 260,
        height: 156,
    },
    [NodeType.Task]: {
        width: 182,
        height: 84,
    },
    [NodeType.Tag]: {
        width: 110,
        height: 48,
    },
}
// 理解分析报告状态枚举
export enum ComprehensionReportStatus {
    NotComprehend = 1, // 未理解
    Comprehended = 2, // 已通过
    Auditing = 3, // 审核中
    Refuse = 4, // 审核未通过
}

// 任务线条状态枚举
export enum TaskStatus {
    Completed = 'Completed',
    Running = 'Running',
    Failed = 'Failed',
    Ready = 'Ready', // 理解任务
}

// 任务状态
export const TaskStatusMap = {
    [TaskStatus.Ready]: {
        color: '#9BA0BA',
        text: '未开始',
    },
    [TaskStatus.Completed]: {
        color: '#52C41B',
        text: '已完成',
    },
    [TaskStatus.Running]: {
        color: '#2F9BFF',
        text: '进行中',
    },
    [TaskStatus.Failed]: {
        color: '#FF5E60',
        text: '异常',
    },
}

export const TaskTypeText = {
    [NodeDataType.Aggregation]: '数据归集任务',
    [NodeDataType.Standardization]: '标准检测任务',
    [NodeDataType.Comprehension]: '数据理解任务',
    [NodeDataType.Quality]: '质量检测任务',
    [NodeDataType.Fusion]: '数据融合任务',
}
// 报告状态
export const ReportStatusMap = {
    [ComprehensionReportStatus.NotComprehend]: {
        color: 'rgba(0, 0, 0, 0.85)',
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
        text: '未生成',
    },
    // [ComprehensionReportStatus.Comprehended]: {
    //     color: '#52c41a',
    //     backgroundColor: '#52c41aoa',
    //     text: '已通过',
    // },
    [ComprehensionReportStatus.Auditing]: {
        color: 'rgba(18, 110, 227, 1)',
        backgroundColor: 'rgba(18, 110, 227, 0.06)',
        text: '审核中',
    },
    [ComprehensionReportStatus.Refuse]: {
        color: 'rgba(255, 77, 79, 1)',
        backgroundColor: 'rgba(255, 77, 79, 0.07)',
        text: '审核未通过',
    },
}

// 端口组类型
export enum PortGroupType {
    Top = 'top',
    Left = 'left',
    Right = 'right',
    Bottom = 'bottom',
}

// 桩样式配置
const PortCircle = {
    r: 4,
    // magnet: true,
    strokeWidth: 1,
    fill: 'transparent',
    stroke: 'transparent',
}

export const PortAttr = (pos: 'top' | 'left' | 'right' | 'bottom') => {
    return {
        position: pos,
        attrs: {
            circle: PortCircle,
        },
    }
}

export const PortConfig = {
    groups: {
        [PortGroupType.Top]: PortAttr('top'),
        [PortGroupType.Left]: PortAttr('left'),
        [PortGroupType.Right]: PortAttr('right'),
        [PortGroupType.Bottom]: PortAttr('bottom'),
    },
}
