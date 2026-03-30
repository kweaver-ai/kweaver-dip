package com.dsg.standardization.common.producer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;

@Service
@Slf4j
public class KafkaProducerService {

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;


    public void sendMessage(String topic, String message) {
        log.info("===发送kafka信息=开始==topic={}==msg=={}",topic,message);
        ListenableFuture<SendResult<String, String>> future = kafkaTemplate.send(topic, message);
        future.addCallback(new ListenableFutureCallback<SendResult<String, String>>() {
            @Override
            public void onFailure(Throwable ex) {
                log.error("==发送kafka信息=失败==topic={}==msg==={}===异常=={}",topic,message,ex.getMessage());
            }

            @Override
            public void onSuccess(SendResult<String, String> result) {
                log.info("===发送kafka信息=成功==topic={}===with offset=={}==msg=={}",topic,result.getRecordMetadata().offset(),message);
            }
        });
//        log.info("===发送kafka信息=结束==topic={}=",topic);
    }

}
