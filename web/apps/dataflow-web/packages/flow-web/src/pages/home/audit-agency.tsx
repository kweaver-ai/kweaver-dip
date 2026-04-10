import { useContext, useEffect, useRef } from "react";
import { MicroAppContext } from "@applet/common";
import { cloneDeep } from "lodash";
// @ts-ignore
import {
  apis,
  components,
} from "@aishu-tech/components/dist/dip-components.full.js";

export default function AuditAgency({}) {
  const { microWidgetProps } = useContext(MicroAppContext);
  const widgetElement = useRef(null);
  const microApp: any = useRef(null);

  useEffect(() => {
    const flowConfig = microWidgetProps?.config?.getMicroWidgetByName(
      "doc-audit-client",
      true,
    );

    setTimeout(() => {
      microApp.current = microWidgetProps?._qiankun?.loadMicroApp({
        name: flowConfig?.name,
        entry: flowConfig?.subapp?.entry,
        container: widgetElement.current,
        activeRule: "/doc-audit-client", // 设置路由前缀
        props: {
          applicationType: "automation", // applicationType 申请类型参数
          microWidgetProps: {
            ...microWidgetProps,
            history: {
              ...microWidgetProps.history,
              getBasePath:
                microWidgetProps.history.getBasePath + "/doc-audit-client",
            },
            config: {
              ...microWidgetProps.config,
              systemInfo: {
                ...microWidgetProps.config.systemInfo,
                realLocation: microWidgetProps.config.systemInfo.location,
              },
            },
            contextMenu: {
              addAccessorFn: apis,
              components,
            },
          },
          systemType: "adp",
        },
      });
    }, 10);

    return () => {
      microApp.current?.unmount();
    };
  }, [widgetElement]);

  return (
    <>
      <div ref={widgetElement}></div>
    </>
  );
}
