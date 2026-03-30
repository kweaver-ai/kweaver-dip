package com.dsg.standardization.common.util;

import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.dsg.standardization.vo.PageVo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class PageUtil {

    /**
     * 分页页码，默认1默认值
     */
    private static final int DEFAULT_PAGE_OFFSET = 1;

    /**
     * 分页条数，默认20默认值
     */
    private static final int DEFAULT_PAGE_LIMIT = 20;

    /**
     * 分页条数，默认20最大值
     */
    private static final int MAX_PAGE_LIMIT = 1000;

    /**
     * 分页条数，默认20最小值
     */
    private static final int MIN_PAGE_LIMIT = 1;

    /**
     * 分页参数校验
     *
     * @param offset
     * @param limit
     * @return
     */
    public static PageVo getPage(Integer offset, Integer limit) {
        if (CustomUtil.isEmpty(offset)) {
            offset = DEFAULT_PAGE_OFFSET;
        }
        if (CustomUtil.isEmpty(limit)) {
            limit = DEFAULT_PAGE_LIMIT;
        }
        offset = offset < DEFAULT_PAGE_OFFSET ? DEFAULT_PAGE_OFFSET : offset;

        limit = limit < MIN_PAGE_LIMIT ? DEFAULT_PAGE_LIMIT : limit;
        limit = limit > MAX_PAGE_LIMIT ? MAX_PAGE_LIMIT : limit;
        PageVo page = new PageVo(offset, limit);
        return page;
    }


    /**
     * 排序构建
     *
     * @param sort        排序字段（前段传递）
     * @param direction   方向：desc/asc
     * @param orderFields 可以参与排序字段列表（数据库字段名称，一般比sort多一个f_前缀。）
     * @return
     */
    public static List<OrderItem> getOrderItems(String sort, String direction, String[] orderFields) {
        // 默认排序使用f_id,
        // 如果排序字段是create_time，修改为使用f_id，f_id使用雪花ID，f_id也是往大了增加的和create_time排序效果基本保持一致
        // 原因： 使用create_time排序查询慢。
        // TODO
        sort = "create_time".equalsIgnoreCase(sort) ? "id" : sort;
        return getOrderItems(sort, direction, orderFields, "f_id");
    }

    /**
     * 排序构建
     *
     * @param sort        排序字段（前段传递）
     * @param direction   方向：desc/asc
     * @param orderFields 可以参与排序字段列表（数据库字段名称，一般比sort多一个f_前缀。）
     * @return
     */
    public static List<OrderItem> getOrderItems(String sort, String direction, String[] orderFields, String defaultSortField) {
        List<OrderItem> orderItems = new ArrayList<>();
        boolean isAsc = "asc".equalsIgnoreCase(direction) ? true : false;
        String sortField = String.format("f_%s", sort);
        for (String filedName : orderFields) {
            if (filedName.equalsIgnoreCase(sortField)) {
                OrderItem orderItem = new OrderItem(filedName, isAsc);
                orderItems.add(orderItem);
            }
        }
        if (orderItems.isEmpty()) {
            if (Arrays.asList(orderFields).contains(defaultSortField)) {
                OrderItem orderItem = new OrderItem(defaultSortField, isAsc);
                orderItems.add(orderItem);
            }
        }
        // 码表、编码规则、标准文件主键ID“f_id”
        if (!"f_id".equalsIgnoreCase(sortField) && Arrays.asList(orderFields).contains("f_id")) {
            OrderItem orderById = new OrderItem("f_id", isAsc);
            orderItems.add(orderById);
        }

        // 数据元主键ID“f_id”
        if (!"f_de_id".equalsIgnoreCase(sortField) && Arrays.asList(orderFields).contains("f_de_id")) {
            OrderItem orderById = new OrderItem("f_de_id", isAsc);
            orderItems.add(orderById);
        }
        return orderItems;
    }
}
