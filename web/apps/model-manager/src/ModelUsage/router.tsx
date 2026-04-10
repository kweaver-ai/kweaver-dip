import { useMemo } from 'react';
import _ from 'lodash';
import intl from 'react-intl-universal';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, ThemeConfig } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';

import locales from '@/locales';
import THEME from '@/theme.ts';
import { prefixCls } from '@/variable';

import ModelUsage from './pages'


const App = (props: any) => {
  const { lang: language = 'zh-cn', container } = props;
  intl.init({ currentLocale: language, locales, warningHandler: () => '' });

  /** 主题色 */
  const theme = useMemo(() => {
    if (!props?.oemConfigs?.theme) return THEME;
    const result = _.cloneDeep(THEME);
    result.token.colorPrimary = props?.oemConfigs?.theme;
    return result;
  }, [props?.oemConfigs?.theme]);

  return (
    <ConfigProvider
      locale={language === 'en-us' ? enUS : zhCN}
      wave={{ disabled: true }}
      theme={theme as ThemeConfig}
      prefixCls={`${prefixCls}-ant`}
      getPopupContainer={() => document.getElementById('mf-model-manager-root') || container!}
      getTargetContainer={() => document.getElementById('mf-model-manager-root') || container!}
    >
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ModelUsage {...props} />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
