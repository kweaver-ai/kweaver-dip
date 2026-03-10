import { start } from 'qiankun'

let qiankunStarted = false

/**
 * 初始化 qiankun
 */
export const initQiankun = () => {
  if (qiankunStarted) {
    return
  }

  start({
    sandbox: {
      strictStyleIsolation: false, // 使用 experimentalStyleIsolation 代替
      experimentalStyleIsolation: true, // 更好的样式隔离
    },
    singular: false, // 允许多个微应用实例同时运行
  })

  qiankunStarted = true
}
