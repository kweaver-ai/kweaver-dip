FROM openjdk:8u342-jdk
ENV TZ=Asia/Shanghai
ENV JAVA_OPTS="-Xms512m -Xmx1024m"
WORKDIR /standardization
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone && \
    sed -i 's/http:\/\/deb.debian.org\/debian/http:\/\/mirrors.aliyun.com\/debian/g' /etc/apt/sources.list && \
    sed -i 's/http:\/\/security.debian.org\/debian-security/http:\/\/mirrors.aliyun.com\/debian-security/g' /etc/apt/sources.list && \
    apt-get update && apt-get install -y --no-install-recommends ca-certificates && \
    update-ca-certificates; \
    chmod -R 775 /standardization;

ADD ./standardization-web-*.jar ./standardization-web.jar
ADD ./config ./config
CMD java -Dfile.encoding=UTF-8 $JAVA_OPTS -jar standardization-web.jar --spring.config.location=./config/