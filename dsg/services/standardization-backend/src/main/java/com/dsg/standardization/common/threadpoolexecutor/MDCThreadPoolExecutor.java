package com.dsg.standardization.common.threadpoolexecutor;

import org.jetbrains.annotations.NotNull;
import org.slf4j.MDC;

import java.util.Map;
import java.util.concurrent.*;

/**
 * 作者: Jie.xu
 * 创建时间：2023/10/13 17:03
 * 功能描述：
 */
public class MDCThreadPoolExecutor extends ThreadPoolExecutor {

    public static ExecutorService newFixedThreadPool(int nThreads) {
        return new MDCThreadPoolExecutor(nThreads, nThreads,
                0L, TimeUnit.MILLISECONDS,
                new LinkedBlockingQueue<Runnable>());
    }

    public MDCThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, @NotNull TimeUnit unit, @NotNull BlockingQueue<Runnable> workQueue) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue);
    }

    public MDCThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, @NotNull TimeUnit unit, @NotNull BlockingQueue<Runnable> workQueue, @NotNull ThreadFactory threadFactory) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory);
    }

    public MDCThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, @NotNull TimeUnit unit, @NotNull BlockingQueue<Runnable> workQueue, @NotNull RejectedExecutionHandler handler) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, handler);
    }

    public MDCThreadPoolExecutor(int corePoolSize, int maximumPoolSize, long keepAliveTime, @NotNull TimeUnit unit, @NotNull BlockingQueue<Runnable> workQueue, @NotNull ThreadFactory threadFactory, @NotNull RejectedExecutionHandler handler) {
        super(corePoolSize, maximumPoolSize, keepAliveTime, unit, workQueue, threadFactory, handler);
    }


    @Override
    public void execute(final Runnable runnable) {
        // 获取父线程MDC中的内容，必须在run方法之前，否则等异步线程执行的时候有可能MDC里面的值已经被清空了，这个时候就会返回null
        final Map<String, String> context = MDC.getCopyOfContextMap();
        super.execute(new Runnable() {
            @Override
            public void run() {
                if (context != null && !context.isEmpty()) {
                    // 将父线程的MDC内容传给子线程
                    MDC.setContextMap(context);
                }
                try {
                    // 执行异步操作
                    runnable.run();
                } finally {
                    // 清空MDC内容
                    MDC.clear();
                }
            }
        });
    }
}
