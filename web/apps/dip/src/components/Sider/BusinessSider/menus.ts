export interface BusinessMenuLeafItem {
  key: string
  icon?: string
  label: string
  path: string
  page:
    | {
        type: 'micro-app'
        app: {
          name: string
          entry: string
        }
      }
    | {
        type: 'component'
        componentKey: string
      }
}

export interface BusinessMenuGroupItem {
  key: string
  icon?: string
  label: string
  children: BusinessMenuItem[]
}

export type BusinessMenuItem = BusinessMenuLeafItem | BusinessMenuGroupItem

export const BUSINESS_NETWORK_BASE_PATH = '/business-network'
export const buildBusinessNetworkPath = (suffix = ''): string =>
  `${BUSINESS_NETWORK_BASE_PATH}${suffix}`

/**
 * business 菜单单一数据源：
 * - Sider 渲染读取这里
 * - 路由注册也读取这里
 * 新增菜单时只改这一处。
 */
export const businessMenuItems: BusinessMenuItem[] = [
  {
    key: 'ontology',
    icon: 'icon-DomainBKN',
    label: '领域业务知识网络',
    path: buildBusinessNetworkPath('/vega/ontology'),
    page: {
      type: 'micro-app',
      app: {
        name: 'ontology-manage',
        entry: '//ip:port/vega/ontology',
      },
    },
  },
  {
    key: 'vega',
    icon: 'icon-SharedBKN',
    label: '通用业务知识网络',
    children: [
      {
        key: 'dataConnection',
        label: '数据连接',
        path: buildBusinessNetworkPath('/vega/data-connect'),
        page: {
          type: 'micro-app',
          app: {
            name: 'data-connect',
            entry: '//ip:port/vega/data-connect',
          },
        },
      },
      {
        key: 'dataView',
        label: '数据视图',
        children: [
          {
            key: 'atomicDataView',
            label: '原子视图',
            path: buildBusinessNetworkPath('/vega/atom-data-view'),
            page: {
              type: 'micro-app',
              app: {
                name: 'atom-data-view',
                entry: '//ip:port/vega/atom-data-view',
              },
            },
          },
          {
            key: 'customDataView',
            label: '自定义视图',
            path: buildBusinessNetworkPath('/vega/custom-data-view'),
            page: {
              type: 'micro-app',
              app: {
                name: 'custom-data-view',
                entry: '//ip:port/vega/custom-data-view',
              },
            },
          },
        ],
      },
      {
        key: 'dataModel',
        label: '数据模型',
        children: [
          {
            key: 'metricModel',
            label: '指标模型',
            path: buildBusinessNetworkPath('/vega/metric-model'),
            page: {
              type: 'micro-app',
              app: {
                name: 'metric-model',
                entry: '//ip:port/vega/metric-model',
              },
            },
          },
        ],
      },
    ],
  },
  {
    key: 'decision-agent',
    icon: 'icon-agent-factory',
    label: '决策智能体',
    children: [
      {
        key: 'myAgents',
        label: '开发',
        path: buildBusinessNetworkPath('/my-agents'),
        page: {
          type: 'micro-app',
          app: {
            name: 'my-agent-list',
            entry: '//ip:port/agent-web/my-agents.html',
          },
        },
      },
      {
        key: 'agent-square',
        label: '广场',
        path: buildBusinessNetworkPath('/agent-square'),
        page: {
          type: 'micro-app',
          app: {
            name: 'agent-square',
            entry: '//ip:port/agent-web/square.html',
          },
        },
      },
    ],
  },
  {
    key: 'execution-factory',
    icon: 'icon-operator-factory',
    label: '执行工厂',
    children: [
      {
        key: 'executionManagement',
        label: '执行单元管理',
        path: buildBusinessNetworkPath('/execution-management'),
        page: {
          type: 'micro-app',
          app: {
            name: 'operator-management',
            entry: '//ip:port/operator-web/operator-management.html',
          },
        },
      },
      {
        key: 'allExecutions',
        label: '全部执行单元',
        path: buildBusinessNetworkPath('/all-executions'),
        page: {
          type: 'micro-app',
          app: {
            name: 'all-operators',
            entry: '//ip:port/operator-web/all-operators.html',
          },
        },
      },
    ],
  },
  {
    key: 'autoflow',
    icon: 'icon-workflow',
    label: 'Autoflow',
    children: [
      {
        key: 'dataflow',
        label: '数据流',
        path: buildBusinessNetworkPath('/dataflow'),
        page: {
          type: 'micro-app',
          app: {
            name: 'data-processing',
            entry: '//ip:port/flow-web/dataStudio.html',
          },
        },
      },
      {
        key: 'workflow',
        label: '工作流',
        path: buildBusinessNetworkPath('/workflow'),
        page: {
          type: 'micro-app',
          app: {
            name: 'workflow',
            entry: '//ip:port/flow-web/workflow.html',
          },
        },
      },
    ],
  },
]

const flattenLeafItems = (items: BusinessMenuItem[]): BusinessMenuLeafItem[] =>
  items.flatMap((item) => ('children' in item ? flattenLeafItems(item.children) : item))

export const businessLeafMenuItems: BusinessMenuLeafItem[] = flattenLeafItems(businessMenuItems)

const findAncestorKeysByPath = (
  items: BusinessMenuItem[],
  pathname: string,
  parentKeys: string[] = [],
): string[] => {
  for (const item of items) {
    if ('children' in item) {
      const found = findAncestorKeysByPath(item.children, pathname, [...parentKeys, item.key])
      if (found.length > 0) {
        return found
      }
      continue
    }
    if (pathname.startsWith(item.path)) {
      return parentKeys
    }
  }
  return []
}

export const getBusinessAncestorKeysByPath = (pathname: string): string[] =>
  findAncestorKeysByPath(businessMenuItems, pathname)

export const defaultBusinessMenuItem = businessLeafMenuItems[0]
