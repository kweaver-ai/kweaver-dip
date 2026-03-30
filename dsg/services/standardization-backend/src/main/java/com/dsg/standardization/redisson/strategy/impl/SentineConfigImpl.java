package com.dsg.standardization.redisson.strategy.impl;


import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.redisson.config.Config;
import com.dsg.standardization.redisson.constant.GlobalConstant;
import com.dsg.standardization.redisson.entity.RedissonProperties;
import com.dsg.standardization.redisson.strategy.RedissonConfigService;


/**
 * @Description: 哨兵集群部署Redis连接配置
 *
 */
@Slf4j
public class SentineConfigImpl implements RedissonConfigService {



    @Override
    public Config createRedissonConfig(RedissonProperties redissonProperties) {
        Config config = new Config();
        try {
            String address = redissonProperties.getAddress();
            String password = redissonProperties.getPassword();
            int database = redissonProperties.getDatabase();
            String[] addrTokens = address.split(",");
            config.useSentinelServers().setCheckSentinelsList(false);
            config.useSentinelServers().setMasterName("mymaster");
            config.useSentinelServers().setDatabase(database);

            //设置sentinel节点的服务IP和端口
            for (int i = 0; i < addrTokens.length; i++) {
                config.useSentinelServers().addSentinelAddress(GlobalConstant.REDIS_CONNECTION_PREFIX.getConstant_value() + addrTokens[i]);
            }

            if (StringUtils.isNotBlank(password)) {
                config.useSentinelServers().setPassword(password).setSentinelPassword(password);
            }

            log.info("初始化[哨兵部署]方式Config,redisAddress:" + address);
        } catch (Exception e) {
            log.error("哨兵部署 Redisson init error", e);

        }
        return config;
    }
}
