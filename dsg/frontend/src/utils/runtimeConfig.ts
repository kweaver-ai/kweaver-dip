type AppRuntimeMode = 'standalone' | 'micro-app'

let runtimeBasename = '/'
let runtimeMode: AppRuntimeMode = 'standalone'

export const setRuntimeConfig = (config: {
    basename?: string
    mode?: AppRuntimeMode
}) => {
    if (config.basename !== undefined) {
        runtimeBasename = config.basename || '/'
    }
    if (config.mode) {
        runtimeMode = config.mode
    }
}

export const getRuntimeBasename = () => runtimeBasename

export const getRuntimeMode = () => runtimeMode

export const isRuntimeMicroApp = () => runtimeMode === 'micro-app'
