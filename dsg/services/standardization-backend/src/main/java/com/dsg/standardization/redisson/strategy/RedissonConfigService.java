package com.dsg.standardization.redisson.strategy;


import org.redisson.config.Config;
import com.dsg.standardization.redisson.entity.RedissonProperties;

/**
 * @Description: Redisson配置构建接口
 *
 */
public interface RedissonConfigService {

    /**
     * 根据不同的Redis配置策略创建对应的Config
     * @param redissonProperties
     * @return Config
     */
    Config createRedissonConfig(RedissonProperties redissonProperties);
}
