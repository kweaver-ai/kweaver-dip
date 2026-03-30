#!/usr/bin/env python3
"""
数据语义批量理解脚本
分批触发 → 分批监听模式

用法:
    python data_semantic_batch.py --token <JWT> --datasource-id <UUID>
    python data_semantic_batch.py --token <JWT> --view-ids <id1,id2>
"""

import argparse
import json
import time
import requests
from datetime import datetime

# ============ 配置 ============
BASE_URL = "https://dip.aishu.cn/api/data-semantic/v1"
VIEW_URL = "https://dip.aishu.cn/api/data-view/v1"
BATCH_SIZE = 50
MAX_POLL = 30
POLL_INTERVAL = 10
MAX_RETRY = 3  # 最大重试次数


def log(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")


def log_warn(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] [WARN] {msg}")


def log_error(msg):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] [ERROR] {msg}")


def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def decode(resp):
    try:
        return json.loads(resp.content.decode('latin1').encode('utf-8').decode('utf-8'))
    except:
        return resp.json()


def query_views(token, ds_id, keyword, limit, offset):
    url = f"{VIEW_URL}/form-view"
    p = {"limit": limit, "offset": offset}
    if ds_id:
        p["datasource_id"] = ds_id
    if keyword:
        p["keyword"] = keyword
    return decode(requests.get(url, headers=headers(token), params=p))


def query_status(token, vid):
    return decode(requests.get(f"{BASE_URL}/{vid}/status", headers=headers(token)))


def trigger(token, vid, retry=0):
    """触发理解，带重试"""
    for i in range(MAX_RETRY):
        try:
            requests.post(f"{BASE_URL}/{vid}/generate", headers=headers(token))
            return True
        except Exception as e:
            if i < MAX_RETRY - 1:
                log_warn(f"触发失败，重试 {i + 1}/{MAX_RETRY}: {vid}")
                time.sleep(2)
            else:
                log_error(f"触发失败 [{MAX_RETRY}次]: {vid} - {e}")
                return False
    return False


def submit(token, vid, retry=0):
    """提交确认，带重试"""
    for i in range(MAX_RETRY):
        try:
            requests.post(f"{BASE_URL}/{vid}/submit", headers=headers(token))
            return True
        except Exception as e:
            if i < MAX_RETRY - 1:
                log_warn(f"提交失败，重试 {i + 1}/{MAX_RETRY}: {vid}")
                time.sleep(2)
            else:
                log_error(f"提交失败 [{MAX_RETRY}次]: {vid} - {e}")
                return False
    return False


def should_continue(prompt=True):
    """询问用户是否继续"""
    if not prompt:
        return True
    
    while True:
        try:
            choice = input("是否继续? (y/n): ").strip().lower()
            if choice in ['y', 'yes', '是']:
                return True
            elif choice in ['n', 'no', '否']:
                return False
        except:
            return False


def run(token, datasource_id=None, view_ids=None, keyword=None, auto_continue=True):
    # ===== 1. 获取视图列表 =====
    if datasource_id:
        log(f"查询视图列表...")
        r = query_views(token, datasource_id, keyword, 1, 1)
        total = r.get("total_count", 0)
        log(f"共 {total} 个视图")
        
        all_ids = []
        for offset in range(1, total + 1, 50):
            r = query_views(token, datasource_id, keyword, 50, offset)
            all_ids.extend([v["id"] for v in r.get("entries", [])])
    else:
        all_ids = view_ids
    
    total = len(all_ids)
    if not total:
        log("无视图")
        return
    
    log(f"开始处理 {total} 个视图")
    
    # ===== 2. 分批触发 =====
    log("分批触发...")
    trigger_fail = []
    
    for i in range(0, len(all_ids), BATCH_SIZE):
        batch = all_ids[i:i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        log(f"  第 {batch_num} 批 ({len(batch)} 个)")
        
        for vid in batch:
            try:
                s = query_status(token, vid).get("understand_status", 0)
                if s == 0:
                    if not trigger(token, vid):
                        trigger_fail.append(vid)
                elif s == 2:
                    if not submit(token, vid):
                        trigger_fail.append(vid)
                    else:
                        trigger(token, vid)
                elif s in [3, 4]:
                    trigger(token, vid)
            except Exception as e:
                log_error(f"触发异常: {vid} - {e}")
                trigger_fail.append(vid)
        
        time.sleep(1)  # 批次间隔
    
    # 触发失败统计
    if trigger_fail:
        log_warn(f"触发失败: {len(trigger_fail)} 个")
        fail_rate = len(trigger_fail) / total
        if fail_rate > 0.1:  # 失败率>10%
            log_warn(f"失败率 {fail_rate*100:.1f}% > 10%，建议检查")
            if not should_continue(auto_continue):
                log("用户终止")
                return
    
    # ===== 3. 分批监听 =====
    log("分批监听...")
    monitor_list = all_ids[:]
    submit_fail = []
    poll_fail = []
    
    for round_num in range(MAX_POLL):
        if not monitor_list:
            break
        
        log(f"轮询 {round_num + 1}/{MAX_POLL}, 剩余 {len(monitor_list)}...")
        
        pending = []  # 继续监听
        submit_list = []  # 待提交
        
        # 分批监听
        for i in range(0, len(monitor_list), BATCH_SIZE):
            batch = monitor_list[i:i + BATCH_SIZE]
            
            for vid in batch:
                try:
                    s = query_status(token, vid).get("understand_status", 0)
                    
                    if s == 1:
                        # 理解中 → 继续等待
                        pending.append(vid)
                    elif s == 2:
                        # 待确认 → 提交
                        submit_list.append(vid)
                    elif s in [3, 4]:
                        # 已完成 → 不需要监听
                        pass
                    else:
                        # 失败或未知
                        poll_fail.append(vid)
                except Exception as e:
                    log_error(f"轮询异常: {vid} - {e}")
                    poll_fail.append(vid)
        
        # 批量提交（带重试）
        if submit_list:
            log(f"  提交 {len(submit_list)} 个")
            for vid in submit_list:
                if not submit(token, vid):
                    submit_fail.append(vid)
                    continue
                # 提交成功后重新触发
                trigger(token, vid)
        
        # 更新监听列表
        monitor_list = pending
        time.sleep(POLL_INTERVAL)
    
    # ===== 4. 最终检查 =====
    log("最终检查...")
    success = 0
    failed = 0
    final_fail_list = []
    
    for i in range(0, len(all_ids), BATCH_SIZE):
        batch = all_ids[i:i + BATCH_SIZE]
        for vid in batch:
            try:
                s = query_status(token, vid).get("understand_status", 0)
                if s in [3, 4]:
                    success += 1
                else:
                    failed += 1
                    final_fail_list.append(vid)
            except:
                failed += 1
                final_fail_list.append(vid)
    
    # ===== 5. 统计报告 =====
    log(f"=" * 40)
    log(f"批量理解完成")
    log(f"  总数: {total}")
    log(f"  成功: {success}")
    log(f"  失败: {failed}")
    log(f"=" * 40)
    
    # 失败详情
    all_fail = trigger_fail + submit_fail + poll_fail + final_fail_list
    if all_fail:
        log_warn(f"失败详情:")
        log_warn(f"  触发失败: {len(trigger_fail)}")
        log_warn(f"  提交失败: {len(submit_fail)}")
        log_warn(f"  轮询异常: {len(poll_fail)}")
        log_warn(f"  最终失败: {len(final_fail_list)}")
        
        fail_rate = failed / total
        if fail_rate > 0.2:  # 失败率>20%
            log_warn(f"⚠️ 失败率 {fail_rate*100:.1f}% > 20%，是否继续处理剩余视图?")
            if not should_continue(auto_continue):
                log("用户终止")
                return
    
    # 输出失败的视图ID
    if final_fail_list:
        log(f"失败的视图ID: {final_fail_list[:10]}...")
    
    return {"total": total, "success": success, "failed": failed}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", required=True)
    parser.add_argument("--datasource-id")
    parser.add_argument("--view-ids")
    parser.add_argument("--keyword")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE)
    parser.add_argument("--auto-continue", action="store_true", help="自动继续，不询问")
    args = parser.parse_args()
    
    if args.view_ids:
        args.view_ids = [v.strip() for v in args.view_ids.split(",")]
    
    run(args.token, args.datasource_id, args.view_ids, args.keyword, 
        auto_continue=args.auto_continue)


if __name__ == "__main__":
    main()