"""
工具函数（与 session 服务 common/units 保持一致）
"""
import random
import string


# 与 Go 版本 letterBytes 一致
LETTER_BYTES = string.ascii_letters + string.digits


def rand_string(n: int) -> str:
    """
    生成指定长度的随机字符串。
    
    参数:
        n: 字符串长度
    
    返回:
        str: 随机字符串
    """
    return ''.join(random.choice(LETTER_BYTES) for _ in range(n))


def rand_len_rand_string(min_len: int, max_len: int) -> str:
    """
    生成指定长度范围内的随机字符串（与 Go 版本 RandLenRandString 一致）。
    
    参数:
        min_len: 最小长度
        max_len: 最大长度
    
    返回:
        str: 随机字符串
    """
    str_len = random.randint(min_len, max_len)
    return rand_string(str_len)


def parse_host(host: str) -> str:
    """
    处理 IPv6 地址，添加方括号（与 Go 版本 ParseHost 一致）。
    
    参数:
        host: 主机地址
    
    返回:
        str: 处理后的主机地址
    """
    if ':' in host:
        return f'[{host}]'
    return host

