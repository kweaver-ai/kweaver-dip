import os
from functools import lru_cache
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()

class Settings(BaseSettings):
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "9595"))

    REDIS_CONNECT_TYPE: str = os.getenv("REDIS_CONNECT_TYPE", 'master-slave')
    REDIS_MASTER_NAME: str = os.getenv("REDIS_MASTER_NAME", 'mymaster')
    REDIS_DB: str = os.getenv("REDIS_DB", "0")

    REDIS_SENTINEL_HOST: str = os.getenv("REDIS_SENTINEL_HOST", 'proton-redis-proton-redis-sentinel.resource')
    REDIS_SENTINEL_PORT: str = os.getenv("REDIS_SENTINEL_PORT", "26379")
    REDIS_SENTINEL_PASSWORD: str = os.getenv("REDIS_SENTINEL_PASSWORD", '')
    REDIS_SENTINEL_USER_NAME: str = os.getenv("REDIS_SENTINEL_USER_NAME", '')

    REDIS_HOST: str = os.getenv("REDIS_HOST", 'proton-redis-proton-redis-sentinel.resource')
    REDIS_PORT: str = os.getenv("REDIS_PORT", "6379")
    REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", 'password')
    REDIS_SESSION_EXPIRE_TIME: int = 60 * 60 * 24


    DPQA_MYSQL_HOST: str = os.getenv("MYSQL_HOST", '10.4.104.59:15236')
    DPQA_MYSQL_USER: str = os.getenv("MYSQL_USERNAME", 'SYSDBA')
    DPQA_MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", 'SYSDBA001')
    DPQA_MYSQL_DATABASE: str = os.getenv("MYSQL_DB", 'af_cognitive_assistant')
    DB_TYPE: str = os.getenv("DB_TYPE","dm8")

    AF_IP: str = os.getenv("AF_IP", "")
    AF_DEBUG_IP: str = os.getenv("AF_DEBUG_IP", "")


    # 模型相关配置
    MODEL_TYPE: str = os.getenv("MODEL_TYPE", "openai")
    TOOL_LLM_MODEL_NAME: str = os.getenv("TOOL_LLM_MODEL_NAME", "Tome-pro")
    TOOL_LLM_OPENAI_API_KEY: str = os.getenv("TOOL_LLM_OPENAI_API_KEY", "EMPTY")
    TOOL_LLM_OPENAI_API_BASE: str = os.getenv("TOOL_LLM_OPENAI_API_BASE", "http://mf-model-api:9898/api/private/mf-model-api/v1/")

    # 外部服务
    HYDRA_URL: str = os.getenv('HYDRA_HOST', 'http://hydra-admin:4445')

    # 调试模式
    DEBUG_MODE: bool = os.getenv('DEBUG_MODE', 'False')

    # 启用 rethink 工具
    ENABLE_RETHINK_TOOL: bool = os.getenv('ENABLE_RETHINK_TOOL', 'False')

    # data-view 服务
    DATA_VIEW_URL: str = os.getenv('DATA_VIEW_URL', 'http://data-view:8123')

    # Kafka 配置
    KAFKA_BOOTSTRAP_SERVERS: str = os.getenv("KAFKA_URI", "kafka-headless.resource:9097")
    KAFKA_DATA_UNDERSTAND_RESULT_TOPIC: str = os.getenv("KAFKA_DATA_UNDERSTAND_RESULT_TOPIC", "data-understanding-responses")
    KAFKA_PASSWORD: str = os.getenv("KAFKA_PASSWORD", "")


    # ADP 服务
    ADP_HOST: str = os.getenv("ADP_HOST", "agent-app")
    ADP_PORT: str = os.getenv("ADP_PORT", "30777")

    XAccountType: str = os.getenv("ADP_X_ACCOUNT_TYPE", "user")

    ADP_AGENT_KEY: str = os.getenv("ADP_AGENT_KEY", "01KF0EPC3SDWKPKFN3PY0XTRHF")
    ADP_BUSINESS_DOMAIN_ID: str = os.getenv("ADP_BUSINESS_DOMAIN_ID", "bd_public")
    ADP_AGENT_FACTORY_HOST: str = os.getenv("ADP_AGENT_FACTORY_HOST", "http://agent-factory:13020")
    ADP_ONTOLOGY_MANAGER_HOST: str = os.getenv("ADP_ONTOLOGY_MANAGER_HOST", "http://bkn-backend-svc:13014")
    ADP_ONTOLOGY_QUERY_HOST: str = os.getenv("ADP_ONTOLOGY_QUERY_HOST", "http://ontology-query-svc:13018")
    ADP_MODEL_API_HOST: str = os.getenv("ADP_MODEL_API_HOST", "http://mf-model-api:9898")

    VIR_ENGINE_URL: str = "http://vega-gateway:8099"
    INDICATOR_MANAGEMENT_URL: str = "http://indicator-management:8213"
    AUTH_SERVICE_URL: str = "http://auth-service:8155"
    CATALOG_URL: str =  os.getenv("AF_CATALOG_URL", "http://data-catalog:8153")
    DATA_MODEL_URL:str = os.getenv("DATA_MODEL_URL", "http://mdl-data-model-svc:13020")

    # Agent Session Settings
    AGENT_SESSION_TYPE: str = "redis"
    AGENT_SESSION_HISTORY_NUM_LIMIT: int = 10
    AGENT_SESSION_HISTORY_MAX: int = 5000

    INDICATOR_RECALL_TOP_K: int = 5
    INDICATOR_REWRITE_QUERY: bool = False
    TEXT2METRIC_MODEL_TYPE: str = "default"
    TEXT2METRIC_DIMENSION_NUM_LIMIT: int = 30
    TEXT2METRIC_FORCE_LIMIT: int = 1000

    TEXT2SQL_MODEL_TYPE: str = "default"
    TEXT2SQL_RECALL_TOP_K: int = 5
    TEXT2SQL_FORCE_LIMIT: int = 200
    TEXT2SQL_DIMENSION_NUM_LIMIT: int = 30
    TEXT2SQL_REWRITE_QUERY: bool = False
    SHOW_SQL_GRAPH: bool = False

    RETURN_RECORD_LIMIT: int = 100
    RETURN_DATA_LIMIT: int = 5000

    # Sandbox Settings
    SANDBOX_URL: str = "http://sandbox-control-plane:8000"

    SQL_HELPER_RECALL_TOP_K: int = 5
    SQL_HELPER_DIMENSION_NUM_LIMIT: int = 30
    SQL_HELPER_FORCE_LIMIT: int = 200

    KNOWLEDGE_ITEM_RETURN_RECORD_LIMIT: int = 30
    KNOWLEDGE_ITEM_HARD_LIMIT: int = 2000
    KNOWLEDGE_ITEM_LIMIT: int = 5

    # DIP 服务
    OUTTER_DIP_URL: str = ""
    DIP_ENGINE_URL: str = "http://kn-data-query:6480"
    DIP_BUILDER_URL: str = "http://kn-knowledge-data:6475"
    DIP_ALG_SERVER_URL: str = "http://kn-search-engine:6479"
    DIP_MODEL_API_URL: str = "http://mf-model-api:9898/api/private/mf-model-api/v1"

    DIP_DATA_MODEL_URL: str = "http://mdl-data-model-svc:13020"
    DIP_MODEL_QUERY_URL: str = "http://mdl-uniquery-svc:13011"

    DIP_AGENT_RETRIEVAL_URL: str = "http://agent-retrieval:30779"
    DEFAULT_AGENT_RETRIEVAL_MAX_CONCEPTS: int = 10
    DEFAULT_AGENT_RETRIEVAL_MODE: str = "keyword_vector_retrieval"

    # DIP VEGA
    OUTTER_VEGA_URL: str = ""

    # Embedding Settings
    EMB_URL: str = 'http://mf-model-api:9898/api/private/mf-model-api/v1/small-model/embedding'
    EMB_URL_suffix: str = ''
    EMB_TYPE: str = 'model_factory'


    # 知识网络管理接口
    KNOWLEDGE_NETWORK_API_BASE: str = "http://bkn-backend-svc:13014/api/ontology-manager"


class Config:
    TIMES: int = 3
    TIMEOUT: int = 50


@lru_cache
def get_settings():
    return Settings()


settings = get_settings()
