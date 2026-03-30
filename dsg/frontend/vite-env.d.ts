/// <reference types="vite/client" />
/// <reference path="./src/types/qiankun.d.ts" />

interface ImportMetaEnv {
    readonly VITE_PORT: string
    readonly VITE_DEBUG_ORIGIN: string
    readonly VITE_HTTPS: string
    readonly VITE_OAUTH2_CLIENT_ID: string
    readonly VITE_OAUTH2_CLIENT_SECRET: string
    readonly [key: string]: any
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// SVG 类型声明
/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// 解决 svg 导入报错
declare module '*.svg' {
    import * as React from 'react'

    export const ReactComponent: React.FunctionComponent<
        React.SVGProps<SVGSVGElement> & { title?: string }
    >
    const src: string
    export default src
}

declare module '*.svg?react' {
    import { FC, SVGProps } from 'react'

    const content: FC<SVGProps<SVGSVGElement>>
    export default content
}

declare module '*.svg?url' {
    const content: string
    export default content
}
