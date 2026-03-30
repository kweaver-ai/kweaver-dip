# -*- coding: utf-8 -*-
# @Time : 2023/12/19 14:22
# @Author : Jack.li
# @Email : jack.li@aishu.cn
# @File : logger.py
# @Project : copilot
import logging
import sys

# 1、创建一个专用于业务的 logger
logger = logging.getLogger('sailor-agent')
# 业务 logger 保持 DEBUG，实际输出级别由 handler 控制
logger.setLevel(logging.DEBUG)

# 防止被多次 import 时重复添加 handler
if not logger.handlers:
    # 尽可能把控制台输出编码切到 UTF-8，避免 Windows 默认 GBK 在遇到特殊字符时报错
    for s in (sys.stdout, sys.stderr):
        try:
            if hasattr(s, "reconfigure"):
                s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            # 不影响程序运行，继续使用系统默认编码
            pass

    # 2、创建一个 handler，用于写入日志文件（显式 UTF-8）
    fh = logging.FileHandler(
        'sailor-agent.log',
        encoding="utf-8",
        errors="replace"
    )
    # 文件中保留尽可能多的业务上下文
    fh.setLevel(logging.DEBUG)

    # 再创建一个 handler，用于输出到控制台（显式指定 stream）
    ch = logging.StreamHandler(stream=sys.stdout)
    # 控制台默认只看 INFO 及以上，避免过于噪音
    ch.setLevel(logging.INFO)

    # 3、定义 handler 的输出格式（formatter）
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

    # 4、给 handler 添加 formatter
    fh.setFormatter(formatter)
    ch.setFormatter(formatter)

    # 5、给 logger 添加 handler
    logger.addHandler(fh)
    logger.addHandler(ch)

    # 6、统一收紧三方组件日志级别（全局只执行一次）
    # SQLAlchemy：仅在 WARNING 及以上时输出，避免所有 SQL 都打印
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    # # HTTP 连接池：只保留 WARNING 及以上
    # logging.getLogger("urllib3.connectionpool").setLevel(logging.WARNING)
    # # jieba 分词：只保留 WARNING 及以上，避免频繁的 DEBUG 初始化日志
    # logging.getLogger("jieba").setLevel(logging.WARNING)
    # # Uvicorn：保留 error 日志，弱化 access 访问日志的噪音
    # logging.getLogger("uvicorn").setLevel(logging.INFO)
    # logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    # logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
