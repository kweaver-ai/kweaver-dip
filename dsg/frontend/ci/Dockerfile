FROM acr.aishu.cn/public/nginx:1.28.1-alpine

COPY /build/ /app/dist/
COPY /ci/web.nginx /etc/nginx/conf.d/default.conf

EXPOSE 8686
ENTRYPOINT ["nginx", "-g", "daemon off;"]
