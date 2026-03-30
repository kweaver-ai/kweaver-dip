import { IHttpStatusMessage } from './types'
import __ from './locale'

export const HTTPStatus = {
    Unauthorized: 401,
    Forbidden: 403,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HTTPVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511,
}

export const getHttpStatusMessage = (): IHttpStatusMessage => ({
    // 200: '服务器成功返回请求的数据。',
    // 201: '新建或修改数据成功。',
    // 202: '一个请求已经进入后台排队（异步任务）。',
    // 204: '删除数据成功。',
    // 400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
    // 401: '用户没有权限（令牌、用户名、密码错误）。',
    // 403: '用户得到授权，但是访问是被禁止的。',
    // 404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
    // 406: '请求的格式不可得。',
    // 410: '请求的资源被永久删除，且不会再得到的。',
    // 422: '当创建一个对象时，发生一个验证错误。',
    [HTTPStatus.Forbidden]: __('暂无权限，您可联系系统管理员配置'),
    [HTTPStatus.InternalServerError]: __('服务器发生错误，请检查服务器。'),
    [HTTPStatus.NotImplemented]: __('此请求方法不被服务器支持且无法被处理。'),
    [HTTPStatus.BadGateway]: __('网关错误。'),
    [HTTPStatus.ServiceUnavailable]: __('服务不可用，服务器暂时过载或维护。'),
    [HTTPStatus.GatewayTimeout]: __('网关超时。'),
    [HTTPStatus.HTTPVersionNotSupported]: __(
        '服务器不支持请求中所使用的HTTP协议版本。',
    ),
    [HTTPStatus.VariantAlsoNegotiates]: __(
        '服务器有一个内部配置错误：对请求的透明内容协商导致循环引用。',
    ),
    [HTTPStatus.InsufficientStorage]: __(
        '服务器有内部配置错误：所选的变体资源被配置为参与透明内容协商本身，因此不是协商过程中的适当端点。',
    ),
    [HTTPStatus.LoopDetected]: __('服务器在处理请求时检测到无限循环。'),
    [HTTPStatus.NotExtended]: __(
        '客户端需要对请求进一步扩展，服务器才能实现它。',
    ),
    [HTTPStatus.NetworkAuthenticationRequired]: __(
        '客户端需要进行身份验证才能获得网络访问权限。',
    ),
})
