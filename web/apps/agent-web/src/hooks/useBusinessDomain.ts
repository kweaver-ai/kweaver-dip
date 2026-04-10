import { useCallback, useEffect, useState } from 'react';
import { useMicroWidgetProps } from './index';

interface BusinessDomain {
  id: string; //  业务域ID
  name: string; // 业务域名
  description: string; // 业务域描述
  creator: string; // 创建者
  products: string[]; // 关联产品
  create_time: string; // 创建时间
}

const PUBLIC_DOMAIN = {
  id: 'bd_public',
  name: '公共业务域',
  description: '面向所有用户，存放公共资源',
  creator: '-',
  products: ['dip'],
  create_time: '2025-11-29T11:44:12.422+08:00',
};

const useBusinessDomain = () => {
  const microWidgetProps = useMicroWidgetProps();
  const [businessDomainState, setBusinessDomainState] = useState<{
    publicBusinessDomain: BusinessDomain | undefined;
    currentBusinessDomain: BusinessDomain | undefined;
    allBusinessDomain: BusinessDomain[] | undefined;
    publicAndCurrentDomainIds: string[] | undefined; // 公共业务域和当前业务域ID组成的去重数组
    businessDomainMap: Record<string, BusinessDomain & { isCurrent?: boolean }> | undefined; // 业务域ID到业务域对象的映射
  }>({
    publicBusinessDomain: undefined,
    currentBusinessDomain: undefined,
    allBusinessDomain: undefined,
    publicAndCurrentDomainIds: undefined,
    businessDomainMap: undefined,
  });

  // 获取业务域
  const getBusinessDomain = useCallback(() => {
    try {
      const allBusinessDomain: BusinessDomain[] = [PUBLIC_DOMAIN];
      const publicBusinessDomain = PUBLIC_DOMAIN;
      const currentBusinessDomain = PUBLIC_DOMAIN;

      // 构建公共业务域和当前业务域ID的去重数组
      const publicAndCurrentDomainIds = [PUBLIC_DOMAIN.id];

      // 构建业务域ID到业务域对象的映射
      const businessDomainMap = allBusinessDomain.reduce(
        (acc, domain) => {
          if (domain.id) {
            if (domain.id === currentBusinessDomain?.id) {
              // @ts-ignore
              domain.isCurrent = true;
            }
            acc[domain.id] = domain;
          }
          return acc;
        },
        {} as Record<string, BusinessDomain & { isCurrent?: boolean }>
      );

      setBusinessDomainState({
        publicBusinessDomain,
        currentBusinessDomain,
        allBusinessDomain,
        publicAndCurrentDomainIds,
        businessDomainMap,
      });
    } catch {}
  }, [microWidgetProps?.businessDomainID]);

  useEffect(() => {
    getBusinessDomain();
  }, [getBusinessDomain]);

  return businessDomainState;
};

export default useBusinessDomain;
