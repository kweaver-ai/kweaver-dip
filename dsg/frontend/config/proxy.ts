export interface ProxyConfig {
    [key: string]: {
        target: string;
        changeOrigin: boolean;
        secure: boolean;
        rejectUnauthorized: boolean;
        pathRewrite?: {
            [key: string]: string;
        };
        bypass?: (req: any, res: any, options: any) => boolean | undefined;
    };
}

export const proxyConfigs: ProxyConfig = {
    '/anyfabric/drawio-app': {
        target: 'http://localhost:8080/',
        changeOrigin: true,
        secure: false,
        rejectUnauthorized: false,
        pathRewrite: {
            '^/anyfabric/drawio-app': '/webapp',
        },
    },
};

export default proxyConfigs;