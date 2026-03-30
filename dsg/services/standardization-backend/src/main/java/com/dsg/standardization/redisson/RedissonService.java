package com.dsg.standardization.redisson;

import lombok.extern.slf4j.Slf4j;
import org.redisson.Redisson;
import org.redisson.api.RBucket;
import org.redisson.api.RLock;

import java.util.concurrent.TimeUnit;

/**
 * 针对源码Redisson进行一层封装
 * 分布式锁封装
 *
 */
@Slf4j
public class RedissonService {


  private  RedissonManager redissonManager;
  private Redisson redisson;

    public RedissonService(RedissonManager redissonManager) {
        this.redissonManager = redissonManager;
        this.redisson = redissonManager.getRedisson();
    }

    public RedissonService() {}

    /********************************操作分布式锁**********************************************/
    /**
     * 加锁操作 （设置锁的有效时间）
     * @param lockName 锁名称
     * @param leaseTime  锁有效时间
     */
    public void lock(String lockName, long leaseTime) {
        RLock rLock = redisson.getLock(lockName);
        rLock.lock(leaseTime,TimeUnit.SECONDS);// NOSONAR
    }

    /**
     * 加锁操作 (锁有效时间采用默认时间30秒）
     * @param lockName 锁名称
     */
    public void lock(String lockName) {
        RLock rLock = redisson.getLock(lockName);
        rLock.lock();// NOSONAR
    }

    /**
     * 加锁操作(tryLock锁，没有等待时间）
     * @param lockName  锁名称
     * @param leaseTime 锁有效时间
     */
    public boolean tryLock(String lockName, long leaseTime) {

        RLock rLock = redisson.getLock(lockName);
        boolean getLock = false;
        try {
            getLock = rLock.tryLock( leaseTime, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            log.error("获取Redisson分布式锁[异常]，lockName=" + lockName, e);
            Thread.currentThread().interrupt();
            e.printStackTrace();
            return false;
        }
        return getLock;
    }

    /**
     * 加锁操作(tryLock锁，有等待时间）
     * @param lockName   锁名称
     * @param leaseTime  锁有效时间
     * @param waitTime   等待时间
     */
    public  boolean tryLock(String lockName, long leaseTime,long waitTime) {

        RLock rLock = redisson.getLock(lockName);
        boolean getLock = false;
        try {
            getLock = rLock.tryLock( waitTime,leaseTime, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            log.error("获取Redisson分布式锁[异常]，lockName=" + lockName, e);
            Thread.currentThread().interrupt();
            e.printStackTrace();
            return false;
        }
        return getLock;
    }

    /**
     * 解锁
     * @param lockName  锁名称
     */
    public void unlock(String lockName) {
        redisson.getLock(lockName).unlock();
    }

    /**
     * 判断该锁是否已经被线程持有
     * @param lockName  锁名称
     */
    public boolean isLock(String lockName) {
        RLock rLock = redisson.getLock(lockName);
        return rLock.isLocked();
    }


    /**
     * 判断该线程是否持有当前锁
     * @param lockName  锁名称
     */
    public boolean isHeldByCurrentThread(String lockName) {
        RLock rLock = redisson.getLock(lockName);
        return rLock.isHeldByCurrentThread();
    }

    public RedissonManager getRedissonManager() {
        return redissonManager;
    }

    public void setRedissonManager(RedissonManager redissonManager) {
        this.redissonManager = redissonManager;
    }

    /********************************操作缓存**********************************************/

    public <T> void putCache(String key, T value, long ttl, TimeUnit timeUnit) {
        RBucket<T> bucket = redisson.getBucket(key);
        bucket.set(value, ttl, timeUnit);// NOSONAR
    }

    public <T>  T getCache(String key) {
        RBucket<T> bucket = redisson.getBucket(key);
        return bucket.get();
    }


}
