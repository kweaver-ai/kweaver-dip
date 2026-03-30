package com.dsg.standardization.service.extra;


import com.dsg.standardization.common.util.JsonUtils;
import com.dsg.standardization.common.util.UrlCallUtil;
import com.dsg.standardization.configuration.CustomConfigruation;
import com.dsg.standardization.dto.TaskDetailDto;
import com.dsg.standardization.vo.HttpResponseVo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AfService {
    @Autowired
    CustomConfigruation afConfigruation;

    public TaskDetailDto getTaskDetailDto(String id) {
        return JsonUtils.json2Obj(getTaskDetailByApi(id).getResult(), TaskDetailDto.class);
    }

    private HttpResponseVo getTaskDetailByApi(String id) {
        String url = getTaskDetailUrl(id);
        return UrlCallUtil.getResponseVoForGet(url);
    }

    private String getTaskDetailUrl(String id) {
        String url = String.format(afConfigruation.getTaskCenterDetailUrl(), id);
        return url;
    }
}
