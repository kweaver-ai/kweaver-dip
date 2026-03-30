package com.dsg.standardization.redisson.config;


import com.dsg.standardization.redisson.entity.RedissonProperties;
import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * @Description: Redisson自动化配置
 *
 */
@Configuration
@ConditionalOnClass(Redisson.class)
@EnableConfigurationProperties(RedissonProperties.class)
//@ComponentScan("com.oujiong.redisson.annotation")
@Slf4j
public class RedissonAutoConfiguration {
//    @Bean
//    @ConditionalOnMissingBean
//    @Order(value = 2)
//    public RedissonService redissonLock(RedissonManager redissonManager) {
//        RedissonService redissonLock = new RedissonService(redissonManager);
//        log.info("[RedissonLock]组装完毕");
//        return redissonLock;
//    }
//
//    @Bean
//    @ConditionalOnMissingBean
//    @Order(value = 1)
//    public RedissonManager redissonManager(RedissonProperties redissonProperties) {
//        RedissonManager redissonManager =
//                new RedissonManager(redissonProperties);
//        log.info("[RedissonManager]组装完毕,当前连接方式:{},连接地址:{}",redissonProperties.getType() , redissonProperties.getAddress());
//        return redissonManager;
//    }
}

