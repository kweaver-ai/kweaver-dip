import { ConfigProvider, message } from 'antd';
import { StyleProvider } from '@ant-design/cssinjs';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import enUS from 'antd/locale/en_US';
import { useAppStore } from '@/store';
import AuditIndex from '@/pages/audit';
import '@/styles/global.less';

interface AppProps {
  basename?: string;
}

const antPrefixCls = 'doc-audit-client';

const localeMap: Record<string, typeof zhCN> = {
  'zh-cn': zhCN,
  'zh-tw': zhTW,
  'en-us': enUS,
};

const App: React.FC<AppProps> = () => {
  const lang = useAppStore(s => s.lang);
  const context = useAppStore(s => s.context);
  const popupContainer = useAppStore(s => s.popupContainer);
  const locale = localeMap[lang] || zhCN;
  const microWidgetProps = useAppStore(s => s.microWidgetProps);

  ConfigProvider.config({
    prefixCls: antPrefixCls,
  });

  message.config({
    getContainer: () => popupContainer!,
  });

  if (context?.systemType !== 'adp') {
    // 智能找数，设置消息框距离顶部距离
    message.config({
      top: 68,
    });
  }

  return (
    <StyleProvider hashPriority="high">
      <ConfigProvider
        button={{
          autoInsertSpace: false,
        }}
        prefixCls={antPrefixCls}
        locale={locale}
        theme={{
          token: {
            colorPrimary: microWidgetProps?.config?.getTheme?.normal,
          },
        }}
        getPopupContainer={() => popupContainer!}
      >
        <AuditIndex />
      </ConfigProvider>
    </StyleProvider>
  );
};

export default App;
