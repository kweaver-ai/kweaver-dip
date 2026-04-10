/** 单测中替代样式导入的占位导出（类名取属性名，便于 snapshot/断言） */
const styleMock = new Proxy(
  {},
  {
    get: (_t, prop) => prop,
  },
)

export default styleMock
