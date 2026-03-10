FROM acr.aishu.cn/public/nginx:1.22.1-alpine-latest

# 给nginx添加权限（如果需要）
RUN chown root /usr/sbin/nginx && \
    chmod 757 -R /usr/sbin/nginx && \
    chmod u+s /usr/sbin/nginx && \
    mkdir -p /var/log/nginx && \
    rm -f /var/log/nginx/access.log /var/log/nginx/error.log && \
    touch /var/log/nginx/access.log /var/log/nginx/error.log && \
    chmod 666 /var/log/nginx/access.log /var/log/nginx/error.log && \
    chmod 777 /var/log/nginx && \
    sed -i "s@www-data@root@g" /etc/nginx/nginx.conf && \
    sed -i "s@# server_tokens.*@server_tokens off;@g" /etc/nginx/nginx.conf

EXPOSE 80

COPY ci/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist /app/dist

