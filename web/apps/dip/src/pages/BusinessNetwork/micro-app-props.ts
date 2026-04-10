import { message } from 'antd';
import { loadMicroApp } from 'qiankun';
import type { UserInfo } from '@/apis/dip-hub/user';
import { businessLeafMenuItems } from '@/components/Sider/BusinessSider/menus';
import { themeColors } from '@/styles/themeColors';
import { BASE_PATH } from '@/utils/config';
import { getAccessToken, getRefreshToken, httpConfig } from '@/utils/http/token-config';

export interface NavigateToMicroWidgetParams {
  name: string;
  path: string;
  isNewTab: boolean;
}

interface BuildBusinessMicroAppPropsOptions {
  basePath: string;
  language: string;
  userInfo?: UserInfo;
  navigateToMicroWidget: (params: NavigateToMicroWidgetParams) => void;
  toggleSideBarShow: (show: boolean) => void;
  navigate: (path: string) => void;
  changeCustomPathComponent: (param: { label: string } | null) => void;
}

const mapLanguage = (language: string): 'zh-cn' | 'zh-tw' | 'en-us' => {
  if (language === 'zh-TW') return 'zh-tw';
  if (language === 'en-US') return 'en-us';
  return 'zh-cn';
};

/** 如 /dip-hub/business-network/vega/xxx → /dip-hub/business-network/vega */
const normalizeVegaBasePath = (basePath: string): string => {
  if (!basePath.includes('/vega/')) return basePath;
  const idx = basePath.indexOf('/vega/');
  return basePath.slice(0, idx + '/vega'.length);
};

const plugins = {
  'operator-flow-detail': {
    app: {
      icon: '',
      pathname: '/operator-flow-detail',
      textENUS: '算子编排日志',
      textZHCN: '算子编排日志',
      textZHTW: '算子编排日志',
    },
    meta: {
      type: 'normal',
    },
    name: 'operator-flow-detail',
    orderIndex: 0,
    parent: 'plugins',
    subapp: {
      activeRule: '/',
      baseRouter: '',
      children: {},
      entry: '//ip:port/flow-web/operatorFlowDetail.html',
    },
  },
  'flow-web-operator': {
    app: {
      icon: '',
      pathname: '/flow-web-operator',
      textENUS: '算子编排',
      textZHCN: '算子编排',
      textZHTW: '算子编排',
    },
    meta: {
      type: 'normal',
    },
    name: 'flow-web-operator',
    orderIndex: 0,
    parent: 'plugins',
    subapp: {
      activeRule: '/',
      baseRouter: '',
      children: {},
      entry: '//ip:port/flow-web/operatorFlow.html',
    },
  },
  'doc-audit-client': {
    app: {
      icon: '//ip:port/doc-audit-client/taskbar-audit.svg',
      pathname: '/doc-audit-client',
      textENUS: '审核流程',
      textZHCN: '审核流程',
      textZHTW: '审核流程',
    },
    meta: {
      type: 'normal',
    },
    name: 'doc-audit-client',
    orderIndex: 0,
    parent: 'plugins',
    subapp: {
      activeRule: '/',
      baseRouter: '',
      children: {},
      entry: '//ip:port/doc-audit-client/',
    },
  },
  'workflow-manage-client': {
    app: {
      icon: '//ip:port/workflow-manage-client/taskbar-audit.svg',
      pathname: '/workflow-manage-client',
      textENUS: '审核模板',
      textZHCN: '审核模板',
      textZHTW: '审核模板',
    },
    meta: {
      type: 'normal',
    },
    name: 'workflow-manage-client',
    orderIndex: 0,
    parent: 'plugins',
    subapp: {
      activeRule: '/',
      baseRouter: '',
      children: {},
      entry: '//ip:port/workflow-manage-client/index.html',
    },
  },
};

/** 构建业务微应用 props */
export const buildBusinessMicroAppProps = ({
  basePath,
  language,
  userInfo,
  navigateToMicroWidget,
  toggleSideBarShow,
  navigate,
  changeCustomPathComponent,
}: BuildBusinessMicroAppPropsOptions) => {
  const resolvedBasePath = normalizeVegaBasePath(basePath);

  // 兼容其他微应用里读取的 microWidgetProps.config.userInfo
  const loginName = userInfo?.account ?? '';
  const userid = userInfo?.id ?? '';
  const userInfoPayload = {
    id: userid,
    user: {
      loginName,
      displayName: userInfo?.vision_name ?? '',
      email: userInfo?.email ?? '',
      // dip-hub 的 userinfo 类型当前不包含 roles，这里先透传空数组占位
      roles: [],
    },
  };
  const lang = mapLanguage(language);
  const theme = themeColors.primary;

  return {
    lang,
    username: loginName,
    userid,
    prefix: '',
    toggleSideBarShow,
    changeCustomPathComponent,
    businessDomainID: 'bd_public',
    changeBusinessDomain: () => {},
    _qiankun: {
      loadMicroApp,
    },
    config: {
      get systemInfo() {
        const config = {
          location: window.location,
          as_access_prefix: '',
        };
        return config;
      },
      getTheme: {
        normal: theme,
        active: '#064fbd',
        activeRgba: '6,79,189',
        disabled: '#65b1fc',
        disabledRgba: '101,177,252',
        hover: '#3a8ff0',
        hoverRgba: '58,143,240',
        normalRgba: '18,110,227',
      },
      getMicroWidgetByName: (name: string) => {
        const plugin = plugins[name as keyof typeof plugins];
        if (!plugin) return undefined;

        return {
          ...plugin,
          subapp: {
            ...plugin.subapp,
            entry: plugin.subapp.entry.replace('ip:port', window.location.host),
          },
        };
      },
      getMicroWidgets() {
        return plugins;
      },
      userInfo: userInfoPayload,
    },
    language: {
      getLanguage: lang,
    },
    token: {
      onTokenExpired: httpConfig.onTokenExpired,
      refreshOauth2Token: httpConfig.refreshToken || (async () => ({ accessToken: '' })),
      getToken: {
        get access_token() {
          return getAccessToken();
        },
        get refresh_token() {
          return getRefreshToken();
        },
        id_token: '',
      },
    },
    theme,
    userInfo: userInfoPayload,
    history: {
      getBasePath: resolvedBasePath,
      async getBasePathByName(microWidgetName: string) {
        // 从menus中找到page.app.name为microWidgetName的item，然后返回该item的path
        let newName = microWidgetName;
        if (newName === 'agent-web-dataagent') {
          newName = 'agent-square';
        }

        const item = businessLeafMenuItems.find(
          menuItem => menuItem.page?.type === 'micro-app' && menuItem.page?.app?.name === newName
        );
        if (!item) return '';

        return `${BASE_PATH}${item.path}`;
      },
      navigateToMicroWidget,
    },
    component: {
      toast: () => {
        const config = () => {
          console.error('toast未开放config配置');
        };
        const destroy = () => {
          console.error('toast未开放destroy方法');
        };
        return { ...message, config, destroy };
      },
    },
    navigate,
    oemConfigs: {
      theme,
    },
  };
};
