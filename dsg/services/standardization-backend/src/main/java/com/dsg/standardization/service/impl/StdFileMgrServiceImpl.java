package com.dsg.standardization.service.impl;

import cn.hutool.core.io.IoUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.core.metadata.OrderItem;
import com.baomidou.mybatisplus.core.toolkit.IdWorker;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.dsg.standardization.common.constant.Constants;
import com.dsg.standardization.common.constant.Message;
import com.dsg.standardization.common.enums.*;
import com.dsg.standardization.common.util.*;
import com.dsg.standardization.service.*;
import com.dsg.standardization.vo.*;
import com.dsg.standardization.common.exception.CustomException;
import com.dsg.standardization.dto.CountGroupByCatalogDto;
import com.dsg.standardization.dto.StdFileRealtionDto;
import com.dsg.standardization.entity.DataElementInfo;
import com.dsg.standardization.entity.DeCatalogInfo;
import com.dsg.standardization.entity.StdFileMgrEntity;
import com.dsg.standardization.mapper.StdFileMgrMapper;
import com.google.common.collect.Lists;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URLEncoder;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Slf4j
@Service("stdFileMgrService")
public class StdFileMgrServiceImpl extends ServiceImpl<StdFileMgrMapper, StdFileMgrEntity> implements StdFileMgrService {

    @Autowired
    StdFileMgrMapper stdFileMgrMapper;

    @Autowired
    IDeCatalogInfoService deCatalogInfoService;

    @Autowired
    OssFileUploadDownloadUtil ossFileUploadDownloadUtil;

    @Autowired
    @Lazy
    IDataElementInfoService dataElementInfoService;

    @Autowired
    @Lazy
    IDictService dictService;


    @Autowired
    @Lazy
    RuleService ruleService;

    @Autowired
    TransactionTemplate transactionTemplate;

    @Value("${basic-bigdata-service:http://basic-bigdata-service:8287}")
    private String basic_bigdata_service_url;

    // 可以用来参与排序的字段，数据库字段名称
    private static final String[] ORDER_TABLE_FIELDS = new String[]{"f_create_time", "f_update_time", "f_act_date", "f_disable_date", "f_state", "f_id"};


    @Override
    @Transactional
    public Result<StdFileMgrVo> create(String number,
                                       String name,
                                       Long catalog_id,
                                       Integer org_type,
                                       String act_date,
                                       String description,
                                       String attachment_type,
                                       String attachment_url, String state, String publish_date, String departmentIds,
                                       MultipartFile file) throws CustomException {
        checkCreateParamAndDataExist(number, name, catalog_id, org_type, act_date, description, attachment_type, attachment_url, file);
        StdFileMgrEntity insert = new StdFileMgrEntity();
        insert.setId(IdWorker.getId());
        insert.setName(name);
        insert.setNumber(number);
        insert.setDescription(description);
        insert.setVersion(1);
        insert.setCatalogId(catalog_id);
        insert.setActDate(toDate(act_date));
        insert.setPublishDate(toDate(publish_date));
        if(CustomUtil.isNotEmpty(state)){
            insert.setState(EnableDisableStatusEnum.getByMessage(state));
        }
        UserInfo user = CustomUtil.getUser();
        Department department = TokenUtil.getDeptPathIds(departmentIds);
        insert.setDepartmentIds(department.getPathId());
        insert.setThirdDeptId(department.getThirdDeptId());
        StdFileAttachmentTypeEnum attachmentTypeEnum = StdFileAttachmentTypeEnum.getByMessage(attachment_type);
        insert.setAttachmentType(attachmentTypeEnum);
        if (StdFileAttachmentTypeEnum.FILE.equals(attachmentTypeEnum)) {
            log.info("==上传oss开始====url====1");
            ossFileUploadDownloadUtil.uploadFile(file, String.valueOf(insert.getId()));
            log.info("==上传oss结束====url===11");
            insert.setFileName(file.getOriginalFilename());
        } else {
            insert.setAttachmentUrl(attachment_url);
        }
        insert.setOrgType(OrgTypeEnum.getByCode(org_type));

        insert.setAuthorityId(user.getUserId());
        insert.setCreateUser(user.getUserName());
        insert.setUpdateUser(user.getUserName());
        Date now = new Date();
        insert.setCreateTime(now);
        insert.setUpdateTime(now);
        stdFileMgrMapper.insert(insert);

        StdFileMgrVo target = new StdFileMgrVo();
        CustomUtil.copyProperties(insert, target);
        if (StdFileAttachmentTypeEnum.FILE.equals(attachmentTypeEnum)) {
            // 异步发送请求去调用文件转换
            this.uploadFile(insert, file.getSize());
        }
        return Result.success(target);

    }

    private void checkCreateParamAndDataExist(String number,
                                              String name,
                                              Long catalog_id,
                                              int org_type,
                                              String act_date,
                                              String description,
                                              String attachment_type,
                                              String attachment_url,
                                              MultipartFile file) {
        List<CheckErrorVo> errors = checkPost(
                number,
                name,
                org_type,
                catalog_id,
                act_date,
                description,
                attachment_type,
                attachment_url,
                file,
                false);
        if (errors.size() > 0) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, errors, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }

        if (CustomUtil.isNotEmpty(number)) {
            List<StdFileMgrEntity> numberQueryMgrEntityList = stdFileMgrMapper.queryByNumber(number);
            if (!CustomUtil.isEmpty(numberQueryMgrEntityList)) {
                errors.add(new CheckErrorVo("number", "标准编号[number]重复"));
            }
        }

        List<StdFileMgrEntity> nameQueryMgrEntity = stdFileMgrMapper.queryByOrgTypeAndName(name, org_type);
        if (!CustomUtil.isEmpty(nameQueryMgrEntity)) {
            errors.add(new CheckErrorVo("name", "标准文件名称[name]重复"));
        }

        if (errors.size() > 0) {
            throw new CustomException(ErrorCodeEnum.DATA_EXIST, errors, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    @Override
    public Result<StdFileMgrVo> update(Long id,
                                       String number,
                                       String name,
                                       Long catalog_id,
                                       Integer org_type,
                                       String act_date,
                                       String description,
                                       String attachment_type,
                                       String attachment_url,String state,String publish_date,String departmentIds,
                                       MultipartFile file) throws CustomException {

        StdFileMgrEntity update = stdFileMgrMapper.selectById(id);
        checkUpdateParamAndDataExists(update, number, name, catalog_id, org_type, act_date, description, attachment_type, attachment_url, file);
        boolean change = checkVersionChange(update, number, name, catalog_id, org_type, act_date, description, attachment_type, attachment_url, departmentIds,file);
        if (!change) {
            StdFileMgrVo target = new StdFileMgrVo();
            CustomUtil.copyProperties(update, target);
            return Result.success(target);
        }
        Department department = TokenUtil.getDeptPathIds(departmentIds);
        update.setDepartmentIds(department.getPathId());
        update.setThirdDeptId(department.getThirdDeptId());

        update.setName(name);
        update.setNumber(number);
        update.setDescription(description == null ? "" : description);
        update.setVersion(update.getVersion() + 1);
        update.setCatalogId(catalog_id);
        update.setActDate(toDate(act_date));
        update.setPublishDate(toDate(publish_date));
        if(CustomUtil.isNotEmpty(state)){
            update.setState(EnableDisableStatusEnum.getByMessage(state));
        }
        StdFileAttachmentTypeEnum attachmentTypeEnum = StdFileAttachmentTypeEnum.getByMessage(attachment_type);
        update.setAttachmentType(attachmentTypeEnum);
        if (StdFileAttachmentTypeEnum.FILE.equals(attachmentTypeEnum)) {
            if (file != null) {
                ossFileUploadDownloadUtil.uploadFile(file, String.valueOf(id));
                update.setFileName(file.getOriginalFilename());
            }
        } else {
            update.setAttachmentUrl(attachment_url);
            update.setFileName("");
        }
        update.setOrgType(OrgTypeEnum.getByCode(org_type));
        update.setUpdateUser(CustomUtil.getUser().getUserName());
        update.setUpdateTime(new Date());
        stdFileMgrMapper.updateById(update);
        stdFileMgrMapper.updateNumberActDate(update.getId(), number, toDate(act_date));

        StdFileMgrVo target = new StdFileMgrVo();
        CustomUtil.copyProperties(update, target);
        if (StdFileAttachmentTypeEnum.FILE.equals(attachmentTypeEnum) && file != null) {
            this.deleteFile(update.getId());
            // 异步发送请求去调用文件转换
            this.uploadFile(update,file.getSize());
        }
        return Result.success(target);
    }

    private boolean checkVersionChange(StdFileMgrEntity old,
                                       String number,
                                       String name,
                                       Long catalog_id,
                                       int org_type,
                                       String act_date,
                                       String description,
                                       String attachment_type,
                                       String attachment_url,String departmentIds,
                                       MultipartFile file) {
        String newNumber = CustomUtil.isEmpty(number) ? "" : number;
        String oldNumber = CustomUtil.isEmpty(old.getNumber()) ? "" : old.getNumber();
        if (!newNumber.equals(oldNumber)) {
            return true;
        }
        if (!old.getName().equals(name)) {
            return true;
        }
        if (!old.getDepartmentIds().equals(departmentIds)) {
            return true;
        }
        if (!old.getCatalogId().equals(catalog_id)) {
            return true;
        }
        if (!old.getOrgType().equals(OrgTypeEnum.getByCode(org_type))) {
            return true;
        }
        if (CustomUtil.isEmpty(toDate(act_date)) && CustomUtil.isNotEmpty(old.getActDate())) {
            return true;
        }

        if (CustomUtil.isNotEmpty(toDate(act_date)) && !toDate(act_date).equals(old.getActDate())) {
            return true;
        }

        String newDescription = description == null ? "" : description;
        String oldDescription = old.getDescription() == null ? "" : old.getDescription();
        if (!newDescription.equals(oldDescription)) {
            return true;
        }
        StdFileAttachmentTypeEnum attachmentType = StdFileAttachmentTypeEnum.getByMessage(attachment_type);
        if (!old.getAttachmentType().equals(attachmentType)) {
            return true;
        }
        if (StdFileAttachmentTypeEnum.FILE.equals(attachmentType) && file != null) {
            return true;
        }
        if (StdFileAttachmentTypeEnum.URL.equals(attachmentType) && !old.getAttachmentUrl().equals(attachment_url)) {
            return true;
        }
        return false;
    }

    @NotNull
    private void checkUpdateParamAndDataExists(StdFileMgrEntity exists,
                                               String number,
                                               String name,
                                               Long catalog_id,
                                               int org_type,
                                               String act_date,
                                               String description,
                                               String attachment_type,
                                               String attachment_url,
                                               MultipartFile file) {
        if (null == exists || exists.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "数据不存在");
        }

        List<CheckErrorVo> errors = checkPost(
                number,
                name,
                org_type,
                catalog_id,
                act_date,
                description,
                attachment_type,
                attachment_url,
                file,
                true);
        if (errors.size() > 0) {
            throw new CustomException(ErrorCodeEnum.PARAMETER_FORMAT_INCORRECT, errors, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }

        List<StdFileMgrEntity> numberQueryMgrEntityList = stdFileMgrMapper.queryByNumber(number);
        if (!CustomUtil.isEmpty(numberQueryMgrEntityList)) {
            for (StdFileMgrEntity row : numberQueryMgrEntityList) {
                if (!row.getId().equals(exists.getId())) {
                    errors.add(new CheckErrorVo("number", "标准编号[number]重复"));
                    break;
                }
            }
        }

        List<StdFileMgrEntity> nameQueryMgrEntity = stdFileMgrMapper.queryByOrgTypeAndName(name, org_type);
        if (!CustomUtil.isEmpty(nameQueryMgrEntity)) {
            for (StdFileMgrEntity row : nameQueryMgrEntity) {
                if (!row.getId().equals(exists.getId())) {
                    errors.add(new CheckErrorVo("name", "标准文件名称[name]重复"));
                    break;
                }
            }
        }

        if (errors.size() > 0) {
            throw new CustomException(ErrorCodeEnum.DATA_EXIST, errors, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    private Date toDate(String act_date) {
        if (CustomUtil.isEmpty(act_date)) {
            return null;
        }
        SimpleDateFormat yyyyMMdd = new SimpleDateFormat("yyyy-MM-dd");
        try {
            return yyyyMMdd.parse(act_date);
        } catch (ParseException e) {
            return null;
        }
    }

    private String dateFormat(Date date) {
        if (CustomUtil.isEmpty(date)) {
            return null;
        }
        SimpleDateFormat yyyyMMdd = new SimpleDateFormat("yyyy-MM-dd");
        try {
            return yyyyMMdd.format(date);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public Result<List<StdFileMgrVo>> queryList(Long catalogId,
                                                String keyword,
                                                Integer orgType,
                                                EnableDisableStatusEnum state,
                                                Integer offset,
                                                Integer limit,
                                                String sort,
                                                String direction,String departmentId) {
        List<Long> catalogIds = new ArrayList<>();
        if (StringUtils.isNotBlank(departmentId) && String.valueOf(DefaultCatalogEnum.File.getCode()).equals(departmentId)) {
            catalogId = Long.valueOf(DefaultCatalogEnum.File.getCode());
            departmentId = null;
        }
        if (StringUtils.isBlank(departmentId)){
            catalogIds = deCatalogInfoService.getIDList(catalogId);
        }
        if (CustomUtil.isEmpty(catalogIds) && StringUtils.isBlank(departmentId)) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, new CheckErrorVo("catalog_id", String.format("catalog_id为[%s]目录不存在；", catalogId)), Message.MESSAGE_DATANOTEXIST_ERROR_SOLUTION);
        }
        Page<StdFileMgrEntity> page = new Page<StdFileMgrEntity>(offset, limit);
        List<OrderItem> orderItems = PageUtil.getOrderItems(sort, direction, ORDER_TABLE_FIELDS);
        page.setOrders(orderItems);
        IPage<StdFileMgrEntity> pageResult = stdFileMgrMapper.queryList(page, catalogIds, keyword, orgType, state,departmentId);
        List<StdFileMgrVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(pageResult.getRecords(), targetList, StdFileMgrVo.class);
        Result result = Result.success(targetList);
        Set<String> deptIds = targetList.stream()
                .filter(now -> CustomUtil.isNotEmpty(now.getDepartmentIds()))
                .map(now -> StringUtil.PathSplitAfter(now.getDepartmentIds()))
                .collect(Collectors.toSet());
        // 查询部门名称
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(deptIds);
        for (StdFileMgrVo row : targetList) {
            if (row.getState().equals(EnableDisableStatusEnum.ENABLE)) {
                row.setDisableDate(null);
                row.setDisableReason(null);
            }
            if (row.getAttachmentType().equals(StdFileAttachmentTypeEnum.FILE)) {
                row.setAttachmentUrl(null);
            }
            row.setDepartmentId(StringUtil.PathSplitAfter(row.getDepartmentIds()));
            row.setDepartmentName(deptEntityMap.get(row.getDepartmentId())==null?null:deptEntityMap.get(row.getDepartmentId()).getName());
            row.setDepartmentPathNames(deptEntityMap.get(row.getDepartmentId())==null?null:deptEntityMap.get(row.getDepartmentId()).getPathName());
        }
        result.setTotalCount(page.getTotal());
        return result;
    }

    @Override
    public Result batchDelete(String ids) {
        String[] idArray = ids.split(",");
        List<Long> idList = new ArrayList<>();
        for (String dictIdStr : idArray) {
            Long dictId = ConvertUtil.toLong(dictIdStr);
            if (!CustomUtil.isEmpty(dictId)) {
                idList.add(dictId);
            }
        }
        if (CustomUtil.isNotEmpty(idList)) {
            stdFileMgrMapper.deleteByIds(idList);
            //发送请求删除文件
            idList.forEach(this::deleteFile);
        }
        return Result.success();
    }

    @Override
    public Result batchInternalDelete(String ids) {
        String[] idArray = ids.split(",");
        List<Long> idList = new ArrayList<>();
        for (String dictIdStr : idArray) {
            Long dictId = ConvertUtil.toLong(dictIdStr);
            if (!CustomUtil.isEmpty(dictId)) {
                idList.add(dictId);
            }
        }
        if (CustomUtil.isNotEmpty(idList)) {
            stdFileMgrMapper.deleteByIds(idList);
        }
        return Result.success();
    }

    // 删除文件管理中文件
    private void deleteFile(Long ossId){
//        String url =basic_bigdata_service_url+"/api/internal/basic-bigdata-service/v1/file-management/fileByOssId/"+ossId;
//        HttpDelete httpDelete = new HttpDelete(url);
//        HttpUtils.dopost(url,httpDelete);
    }

    //更新文件管理中文件
    private boolean uploadFile(StdFileMgrEntity stdFileMgrEntity,long fileSize){
//        FileUploadDto dto =new FileUploadDto();
//        String fileName = stdFileMgrEntity.getFileName();
//        dto.setName(stdFileMgrEntity.getName()+fileName.substring(fileName.lastIndexOf('.')));
//        dto.setType("standard_spec");
//        String id = String.valueOf(stdFileMgrEntity.getId());
//        dto.setOss_id(id);
//        dto.setRelated_object_id(id);
//        dto.setFileSize(fileSize);
//        String url =basic_bigdata_service_url+"/api/internal/basic-bigdata-service/v1/file-management/upload";
//        HttpPost httpPost = new HttpPost(url);
//        StringEntity stringEntity = new StringEntity(JSONObject.valueToString(dto), "UTF-8");
//        stringEntity.setContentType("application/json");
//        httpPost.setEntity(stringEntity);
//        HttpResponseVo vo= HttpUtils.dopost(url,httpPost);
//        return vo.isSucesss();
          return true;
    }

    @Override
    public Result<List<StdFileMgrVo>> queryByIds(List<Long> ids) {
        List<StdFileMgrEntity> sourceList = stdFileMgrMapper.queryByIds(ids);
        List<StdFileMgrVo> targetList = new ArrayList<>();
        CustomUtil.copyListProperties(sourceList, targetList, StdFileMgrVo.class);
        for (StdFileMgrVo row : targetList) {
            if (row.getState().equals(EnableDisableStatusEnum.ENABLE)) {
                row.setDisableDate(null);
                row.setDisableReason(null);
            }
            if (row.getAttachmentType().equals(StdFileAttachmentTypeEnum.FILE)) {
                row.setAttachmentUrl(null);
            }
        }
        return Result.success(targetList);
    }

    @Override
    public Result updateState(Long id, EnableDisableStatusEnum statusEnum, String disableReason) {
        StdFileMgrEntity stdFileMgrEntity = stdFileMgrMapper.selectById(id);
        if (null == stdFileMgrEntity || stdFileMgrEntity.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "数据不存在");
        }
        //Date now = new Date();
        stdFileMgrEntity.setState(statusEnum);
        if (EnableDisableStatusEnum.DISABLE.equals(statusEnum)) {
            stdFileMgrEntity.setDisableDate(new Date());
            stdFileMgrEntity.setDisableReason(disableReason);
        } else {
            stdFileMgrEntity.setDisableDate(null);
            stdFileMgrEntity.setDisableReason("");
        }

        //stdFileMgrEntity.setUpdateUser("");
        //stdFileMgrEntity.setUpdateTime(now);
        stdFileMgrMapper.updateById(stdFileMgrEntity);
        return Result.success();
    }

    @Override
    public StdFileMgrVo queryById(Long id) {
        StdFileMgrEntity source = stdFileMgrMapper.selectById(id);
        if (source == null) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST.getErrorCode(), "记录不存在", new CheckErrorVo("id", String.format("id[%d]对应的数据不存在", id)));
        }
        StdFileMgrVo target = new StdFileMgrVo();
        CustomUtil.copyProperties(source, target);
        DeCatalogInfo catalog = deCatalogInfoService.getById(source.getCatalogId());
        if (CustomUtil.isNotEmpty(catalog)) {
            target.setCatalogName(catalog.getCatalogName());
        }
        if (target.getState().equals(EnableDisableStatusEnum.ENABLE)) {
            target.setDisableDate(null);
            target.setDisableReason(null);
        }
        if (target.getAttachmentType().equals(StdFileAttachmentTypeEnum.FILE)) {
            target.setAttachmentUrl(null);
        }
        String deptId = StringUtil.PathSplitAfter(source.getDepartmentIds());
        Map<String, Department> deptEntityMap = TokenUtil.getMapDeptInfo(Arrays.asList(deptId));
        target.setDepartmentId(deptId);
        target.setDepartmentName(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getName());
        target.setDepartmentPathNames(deptEntityMap.get(deptId)==null?null:deptEntityMap.get(deptId).getPathName());

        return target;
    }

    @Override
    public Result<Integer> removeCatalog(List<Long> ids, Long catalogId) {
        checkCatalogIdExist(catalogId);
        for (Long id : ids) {
            StdFileMgrEntity dict = stdFileMgrMapper.selectById(id);
            if (dict == null) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, CheckErrorUtil.createError("ids", String.format("id为[%s]记录不存在", id)));
            }
        }
        UserInfo userInfo = CustomUtil.getUser();
        int rlt = stdFileMgrMapper.removeCatalog(ids, catalogId, userInfo.getUserName());
        return Result.success(rlt);
    }

    @Override
    public void download(HttpServletResponse response, Long id) {
        StdFileMgrEntity stdFileMgrEntity = stdFileMgrMapper.selectById(id);
        if (null == stdFileMgrEntity || stdFileMgrEntity.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, "数据不存在");
        }

        if (StdFileAttachmentTypeEnum.URL.equals(stdFileMgrEntity.getAttachmentType())) {
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed, "[URL]类型没有文件附件");
        }

        String exportFileName = stdFileMgrEntity.getFileName();
        try {
            response.setCharacterEncoding("UTF-8");
            response.setHeader("content-Type", "application/octet-stream");
            response.setHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(exportFileName, "UTF-8"));
            OutputStream os = response.getOutputStream();
            ossFileUploadDownloadUtil.download(String.valueOf(id), os);
            os.flush();
            os.close();
        } catch (IOException e) {
            String msg = String.format("文件[%s]下载失败", exportFileName);
            log.error(msg, e);
            throw new CustomException(ErrorCodeEnum.ExcelExportError, msg, null, "请重新尝试导出。详细信息参见产品 API 文档。");
        }
    }

    @Override
    public void downloadBatch(HttpServletResponse response, List<Long> ids) {

        List<StdFileMgrEntity> files = stdFileMgrMapper.queryByIds(ids);
        checkFileExists(files, ids);
        if (CustomUtil.isEmpty(files)) {
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed, "[URL]类型没有文件附件");
        }
        ZipOutputStream zipout = null;
        try {
            String doloadFileName = String.format("标准文件_%s.zip", DateFormatUtils.format(new Date(), "yyyyMMddHHmmss"));
            response.setContentType("application/octet-stream");
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(doloadFileName, "UTF-8"));
            zipout = new ZipOutputStream(response.getOutputStream());
            Map<String, byte[]> fileByteMap = getFiles(files);
            if (CustomUtil.isEmpty(fileByteMap)) {
                throw new CustomException(ErrorCodeEnum.FileDownloadFailed, "[URL]类型没有文件附件");
            }
            for (Map.Entry<String, byte[]> data : fileByteMap.entrySet()) {
                InputStream bufferIn = new BufferedInputStream(new ByteArrayInputStream(data.getValue()));
                byte[] bs = new byte[1024];
                Arrays.fill(bs, (byte) 0);
                //创建压缩文件内的文件
                zipout.putNextEntry(new ZipEntry(data.getKey()));
                int len = -1;
                while ((len = bufferIn.read(bs)) > 0) {
                    zipout.write(bs, 0, len);
                }
                bufferIn.close();
            }
        } catch (Exception e) {
            String msg = String.format("文件下载失败");
            log.error(msg, e);
            throw new CustomException(ErrorCodeEnum.FileDownloadFailed, msg, null, "请重新尝试导出。详细信息参见产品 API 文档。");
        } finally {
            IoUtil.close(zipout);
        }

    }


    private Map<String, byte[]> getFiles(List<StdFileMgrEntity> files) {
        Map<String, byte[]> fileByteMap = new HashMap<>();
        try {
            Set<String> repeatFileNameSet = getReatFileName(files);
            for (StdFileMgrEntity row : files) {
                if (row.isDelete()) {
                    continue;
                }
                String entryFileName = row.getFileName();
                if (repeatFileNameSet.contains(entryFileName)) {
                    String filePrefix = entryFileName.substring(0, entryFileName.lastIndexOf("."));
                    String fileSuffix = entryFileName.substring(entryFileName.lastIndexOf(".") + 1, entryFileName.length());
                    entryFileName = String.format("%s(%s)(%s).%s", filePrefix, row.getOrgType().getMessage(), row.getName(), fileSuffix);
                }
                byte[] fileBytes = ossFileUploadDownloadUtil.download(String.valueOf(row.getId()));
                fileByteMap.put(entryFileName, fileBytes);
            }
        } catch (Exception e) {
            log.error("下载失败：", e);
            throw new CustomException(ErrorCodeEnum.ExcelExportError, "下载文件失败", null, "请重新尝试导出。详细信息参见产品 API 文档。");
        }
        return fileByteMap;
    }

    private void checkFileExists(List<StdFileMgrEntity> files, List<Long> ids) {
        Map<Long, StdFileMgrEntity> idEntryMap = new HashMap<>(files.size());
        for (StdFileMgrEntity row : files) {
            idEntryMap.put(row.getId(), row);
        }
        for (Long id : ids) {
            if (!idEntryMap.containsKey(id)) {
                throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, String.format("标准文件id[%s]对应的记录不存在", id));
            } else {
                StdFileMgrEntity fileMgrEntity = idEntryMap.get(id);
                if (fileMgrEntity.isDelete()) {
                    throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST, String.format("标准文件[%s]对应的记录不存在", fileMgrEntity.getName()));
                }
                if (StdFileAttachmentTypeEnum.URL.equals(fileMgrEntity.getAttachmentType())) {
                    files.remove(idEntryMap.get(id));
                }
            }
        }
    }

    private Set<String> getReatFileName(List<StdFileMgrEntity> dataList) {

        Map<String, Integer> map = new HashMap<>();
        for (StdFileMgrEntity row : dataList) {
            if (row.getAttachmentType().equals(StdFileAttachmentTypeEnum.FILE) && !row.isDelete()) {
                String key = row.getFileName();
                if (map.containsKey(key)) {
                    map.put(key, map.get(key) + 1);
                } else {
                    map.put(key, 1);
                }
            }
        }
        Set<String> set = new HashSet<>();
        for (Map.Entry<String, Integer> row : map.entrySet()) {
            if (row.getValue() > 1) {
                set.add(row.getKey());
            }
        }
        return set;
    }

    @Override
    public Result<List<DataElementInfo>> queryRelationDataElements(Long id, Integer offset, Integer limit) {
        StdFileMgrEntity file = stdFileMgrMapper.selectById(id);
        if (file == null) {
            return Result.success();
        }
        return dataElementInfoService.queryPageByFileId(id, offset, limit);
    }

    @Override
    public Result<List<DictVo>> queryRelationDicts(Long id, Integer offset, Integer limit) {
        StdFileMgrEntity file = stdFileMgrMapper.selectById(id);
        if (file == null) {
            return Result.success();
        }
        return dictService.queryPageByFileId(id, offset, limit);
    }

    @Override
    public Result<List<RuleVo>> queryRelationRules(Long id, Integer offset, Integer limit) {
        StdFileMgrEntity file = stdFileMgrMapper.selectById(id);
        if (file == null) {
            return Result.success();
        }
        return ruleService.queryPageByFileId(id, offset, limit);
    }

    @Override
    @Transactional
    public Result addRelation(Long id, StdFileRealtionDto realtionDto) {
        StdFileMgrEntity data = stdFileMgrMapper.selectById(id);
        if (data == null || data.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST);
        }

        Boolean rlt = transactionTemplate.execute(status -> {
            try {
                dataElementInfoService.addRelation(id, realtionDto.getRelationDeList());
                dictService.addRelation(id, realtionDto.getRelationDictList());
                ruleService.addRelation(id, realtionDto.getRelationRuleList());
                return true;
            } catch (Exception e) {
                // 回滚事务
                status.setRollbackOnly();
                log.error("", e);
                return false;
            }
        });

        return Result.success();
    }

    @Override
    public Result<Map<String, Object>> queryRelations(Long id) {
        StdFileMgrEntity file = stdFileMgrMapper.selectById(id);
        if (file == null || file.isDelete()) {
            throw new CustomException(ErrorCodeEnum.DATA_NOT_EXIST);
        }
        List<DataElementInfo> deRelations = dataElementInfoService.queryByFileId(id);
        List<DictVo> dictRelations = dictService.queryByFileId(id);
        List<RuleVo> ruleRelations = ruleService.queryByFileId(id);
        Map<String, Object> resultMap = new HashMap<>();
        resultMap.put("relation_de_list", deRelations);
        resultMap.put("relation_dict_list", dictRelations);
        resultMap.put("relation_rule_list", ruleRelations);
        return Result.success(resultMap);
    }

    @Override
    public Result<Boolean> queryDataExists(Long filterId, String number, Integer orgType, String name,String departmentIds) {
        String deptIds =  TokenUtil.getDeptPathIds(departmentIds).getPathId();
        List<StdFileMgrEntity> dataList = stdFileMgrMapper.queryData(filterId, number, orgType, name,deptIds);
        if (CustomUtil.isEmpty(dataList)) {
            return Result.success(false);
        }
        return Result.success(true);
    }

    private void checkCatalogIdExist(Long catalogId) {
        boolean exist = deCatalogInfoService.checkCatalogIsExist(catalogId, CatalogTypeEnum.File);
        if (!exist) {
            List<CheckErrorVo> errorList = Lists.newArrayList();
            errorList.add(new CheckErrorVo("catalog_id", "目录不存在或已删除"));
            throw new CustomException(ErrorCodeEnum.InvalidParameter, errorList, Message.MESSAGE_PARAM_ERROR_SOLUTION);
        }
    }

    private List<CheckErrorVo> checkPost(String number,
                                         String name,
                                         int org_type,
                                         Long catalog_id,
                                         String act_date,
                                         String description,
                                         String attachment_type,
                                         String attachment_url,
                                         MultipartFile file,
                                         boolean update) {
        List<CheckErrorVo> checkErrors = Lists.newLinkedList();
        int LENGTH_STRING = 300;
        // 标准类型检测枚举有效性
        if (CustomUtil.isNotEmpty(number) && number.length() > LENGTH_STRING) {
            checkErrors.add(new CheckErrorVo("number", "标准编号为空或长度超过" + LENGTH_STRING));
        }

        if (CustomUtil.isEmpty(name) || name.length() > LENGTH_STRING) {
            checkErrors.add(new CheckErrorVo("name", "标准文件名称为空或长度超过" + LENGTH_STRING));
        }

        if (OrgTypeEnum.getByCode(org_type).equals(OrgTypeEnum.Unknown)) {
            checkErrors.add(new CheckErrorVo("org_type", "标准分类为空或者参数值不正确"));
        }

        if (CustomUtil.isNotEmpty(act_date) && null == toDate(act_date)) {
            checkErrors.add(new CheckErrorVo("act_date", "实施日期格式不正确"));
        }
        if (CustomUtil.isEmpty(attachment_type) || null == StdFileAttachmentTypeEnum.getByMessage(attachment_type)) {
            checkErrors.add(new CheckErrorVo("attachment_type", "文件信息为空或者参数值不正确"));
        } else {
            checkAttachmentFile(attachment_type, attachment_url, file, update, checkErrors);
        }

        if (CustomUtil.isEmpty(catalog_id)) {
            checkErrors.add(new CheckErrorVo("catalog_id", "目录不能为空"));
        } else {
            boolean exist = deCatalogInfoService.checkCatalogIsExist(catalog_id, CatalogTypeEnum.File);
            if (!exist) {
                checkErrors.add(new CheckErrorVo("catalog_id", String.format("目录id[%s]对应的目录不存在", catalog_id)));
            }
        }

        if (CustomUtil.isNotEmpty(description) && description.length() > LENGTH_STRING) {
            checkErrors.add(new CheckErrorVo("description", "说明长度超过" + LENGTH_STRING));
        }
        return checkErrors;

    }

    private static void checkAttachmentFile(String attachment_type, String attachment_url, MultipartFile file,
                                            boolean update, List<CheckErrorVo> checkErrors) {
        StdFileAttachmentTypeEnum attachmentTypeEnum = StdFileAttachmentTypeEnum.getByMessage(attachment_type);
        if (attachmentTypeEnum == null) {
            checkErrors.add(new CheckErrorVo("attachment_type", "文件信息参数值不正确"));
        } else {
            if (attachmentTypeEnum.equals(StdFileAttachmentTypeEnum.FILE)) {
                if (file == null) {
                    if (!update) {
                        checkErrors.add(new CheckErrorVo("file", "文件不能为空"));
                    }
                } else {
                    String fileName = file.getOriginalFilename().toLowerCase();
                    if (!(fileName.endsWith(".doc") || fileName.endsWith(".docx") || fileName.endsWith(".pdf")  || fileName.endsWith(".txt") || fileName.endsWith(".xlsx") || fileName.endsWith(".xls") || fileName.endsWith(".ppt") || fileName.endsWith(".pptx"))) {
                        checkErrors.add(new CheckErrorVo("file", "不支持的文件类型"));
                    } else if (file.isEmpty()) {
                        checkErrors.add(new CheckErrorVo("file", "不能上传空内容文件"));
                    } else if (!CustomUtil.checkFileSize(file.getSize(), Constants.FILE_UPLOAD_LIMIT_SIZE, "M")) {
                        log.error("====上传的文件名=={}===大小=={}===超过限制的大小==",fileName,file.getSize());
                        checkErrors.add(new CheckErrorVo("file", "文件不能超过30M"));
                    }
                }
            } else {
                if (CustomUtil.isEmpty(attachment_url)) {
                    checkErrors.add(new CheckErrorVo("attachment_url", "链接不能为空"));
                } else if (attachment_url.length() > 2048) {
                    checkErrors.add(new CheckErrorVo("attachment_url", "链接长度超过2048"));
                }
            }
        }
    }

    @Override
    public Map<Long, Integer> getCountMapGroupByCatalog() {
        List<CountGroupByCatalogDto> countList = stdFileMgrMapper.selectCountList();
        Map<Long, Integer> countMap = new HashMap<>();
        if (CustomUtil.isNotEmpty(countList)) {
            countList.forEach(item -> {
                countMap.put(item.getCatalogId(), item.getCount());
            });
        }
        return countMap;
    }

    @Override
    public List<StdFileMgrEntity> getByName(String name) {
        //查询字符串规范化
        name = StringUtils.trim(name);
        name = StringUtils.substring(name, 0, 64);
        if (!StringUtils.isBlank(name)) {
            name = "%" + name.toLowerCase() + "%";
        }
        LambdaQueryWrapper<StdFileMgrEntity> queryWrapper = new LambdaQueryWrapper();
        queryWrapper.eq(StdFileMgrEntity::getDeleted, false);

//        queryWrapper.like(!StringUtils.isBlank(name), "f_catalog_name", StringUtils.substring(name, 0, 64));
        queryWrapper.apply(!StringUtils.isBlank(name), "(lower(f_name) like {0})", name);
        List<StdFileMgrEntity> result = stdFileMgrMapper.selectList(queryWrapper);
        return result;
    }

}