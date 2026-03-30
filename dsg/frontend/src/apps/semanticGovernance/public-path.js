/**
 * public-path配置
 * 用于qiankun微应用的动态publicPath
 */
// eslint-disable-next-line no-underscore-dangle
if (window.__POWERED_BY_QIANKUN__) {
    // eslint-disable-next-line no-undef
    __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__
}
