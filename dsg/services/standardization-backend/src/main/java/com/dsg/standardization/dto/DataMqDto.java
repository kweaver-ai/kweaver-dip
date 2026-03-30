package com.dsg.standardization.dto;

import lombok.Data;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Data
public class DataMqDto {

    private Map header;
    private Payload payload;



    @Data
    public class Payload{
        private String type;
        private Content content;
    }

    @Data
    public class Content<T>{
        private String type;
        private String table_name;
        private List<T> entities;
        private Date updated_at;
    }


}


