package com.dsg.standardization.vo.DataElementVo;

import com.baomidou.mybatisplus.annotation.TableField;
import com.dsg.standardization.common.util.CustomUtil;
import com.dsg.standardization.entity.DataElementInfo;
import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

/**
 * @Author: WangZiYu
 * @description:com.dsg.standardization.web.vo
 * @Date: 2022/12/16 22:57
 */
@Data
@ApiModel(description = "数据元信息响应")
public class DataElementPostVo extends DataElementInfo {
    /**
     * 文件标识集合
     */
    @ApiModelProperty(value="标准文件ID数组",dataType = "java.util.List")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    @Size(max = 10, message = "最多10个标准文件ID")  // 校验集合长度
    List<Long> std_files;

    /**
     * 码表id
     */
    @ApiModelProperty(value="关联码表ID",dataType = "java.lang.String" ,example = "11")
    @TableField(value ="f_dict_code")
    @JsonFormat(shape = JsonFormat.Shape.STRING)
    private Long dict_id;


    public DataElementInfo convertToDataElementInfo(){
        DataElementInfo dataElementInfo = new DataElementInfo();
        CustomUtil.copyProperties(this,dataElementInfo);
        dataElementInfo.setDictCode(this.dict_id==null?0:this.dict_id);
        return dataElementInfo;
    }
}
