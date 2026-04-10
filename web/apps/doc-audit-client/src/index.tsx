import './public-path';
import { createRoot, type Root } from 'react-dom/client';
import { apis } from '@aishu-tech/components/dist/dip-components.min';
import '@aishu-tech/components/dist/dip-components.min.css';
import App from './App';
import { useAppStore } from './store';
import { setConfig as setHttpConfig, LangType } from '@/utils/http';
import { changeLanguage } from './i18n';
import type { AppContext } from './types';

import './styles/global.less';

declare global {
  interface Window {
    __POWERED_BY_QIANKUN__?: boolean;
    __INJECTED_PUBLIC_PATH_BY_QIANKUN__?: string;
  }
}

let root: Root | null = null;

function getPopupContainer(container?: HTMLElement): HTMLElement {
  const rootId = 'doc-audit-client-root';
  return container?.querySelector(`#${rootId}`) || document.getElementById(rootId)!;
}

function render(popupContainer: HTMLElement) {
  root = createRoot(popupContainer);
  root.render(<App />);
}

// qiankun 生命周期 - bootstrap
export async function bootstrap() {}

// qiankun 生命周期 - mount
export async function mount(context: AppContext) {
  const { setContext, setMicroWidgetProps, setArbitrailyAuditLog, setLang, setPopupContainer } = useAppStore.getState();
  const popupContainer = getPopupContainer((context as any).container);

  setContext(context);
  setPopupContainer(popupContainer);

  const { microWidgetProps } = context;

  if (microWidgetProps) {
    setMicroWidgetProps(microWidgetProps);

    if (context.arbitrailyAuditLog) {
      setArbitrailyAuditLog(context.arbitrailyAuditLog);
    }

    const language = microWidgetProps.language.getLanguage;
    changeLanguage(language);
    setLang(language);
    const location = microWidgetProps.config.systemInfo.location || microWidgetProps.config.systemInfo.realLocation;
    const protocol = location.protocol;
    const host = location.hostname;
    const port = location.port ? Number(location.port) : location.protocol === 'https:' ? 443 : 80;
    const prefix = microWidgetProps.prefix || '';
    const getToken = () => microWidgetProps.token.getToken.access_token;
    const refreshToken = microWidgetProps.token.refreshOauth2Token;
    const onTokenExpired = microWidgetProps.token.onTokenExpired;
    const businessDomainID = microWidgetProps.businessDomainID || '';
    const theme = microWidgetProps.config.getTheme.normal || '#126ee3';

    setHttpConfig({
      protocol,
      host,
      port,
      lang: language as LangType,
      prefix,
      getToken,
      refreshToken,
      onTokenExpired,
      businessDomainID,
    });

    // 设置dip-components所需的信息
    apis.setup({
      protocol,
      host,
      port,
      lang: language as LangType,
      prefix,
      getToken,
      refreshToken,
      onTokenExpired,
      theme,
      popupContainer,
    });
  }

  render(popupContainer);
}

// qiankun 生命周期 - unmount
export async function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}
