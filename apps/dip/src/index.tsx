import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import './styles/theme.less'
import { observeCLS } from './utils/observeCLS'

// 初始化应用
async function initApp() {
  // if (process.env.NODE_ENV === 'development') {
  //   observeCLS()
  // }
  // 给 html 和 body 添加标识类，用于样式隔离，避免微应用的全局样式覆盖主应用
  document.documentElement.classList.add('dip-kweaver')
  document.body.classList.add('dip-kweaver')

  const rootEl = document.getElementById('dip-kweaver-root')
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl)
    root.render(
      // <React.StrictMode>
      <App />,
      // </React.StrictMode>
    )
  }
}

initApp()
