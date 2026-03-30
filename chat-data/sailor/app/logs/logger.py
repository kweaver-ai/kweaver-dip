# -*- coding: utf-8 -*-
# @Time : 2023/12/19 14:22
# @Author : Jack.li
# @Email : jack.li@xxx.cn
# @File : logger.py
# @Project : copilot
import logging
from config import settings

# 1、创建一个logger
logger = logging.getLogger('sailor')
if settings.IF_DEBUG:
    logger.setLevel(logging.DEBUG)
else:
    logger.setLevel(logging.INFO)

# 2、创建一个handler，用于写入日志文件
fh = logging.FileHandler('sailor.log')
if settings.IF_DEBUG:
    fh.setLevel(logging.DEBUG)
else:
    fh.setLevel(logging.INFO)

# 再创建一个handler，用于输出到控制台
ch = logging.StreamHandler()
if settings.IF_DEBUG:
    ch.setLevel(logging.DEBUG)
else:
    ch.setLevel(logging.INFO)

# 3、定义handler的输出格式（formatter）
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# 4、给handler添加formatter
fh.setFormatter(formatter)
ch.setFormatter(formatter)


# 5、给logger添加handler
logger.addHandler(fh)
logger.addHandler(ch)
