import { PlusCircleOutlined } from "@ant-design/icons";
import { FC, useContext, useState } from "react";
import { Popover, Space, Tooltip } from "antd";
import styles from "./editor.module.less";
import { MicroAppContext, useTranslate } from "@applet/common";
import { EditorContext } from "./editor-context";
import { LoopContext } from "./loop-step";
import brancheIcon from "./assets/branche.svg";
import cycleIcon from "./assets/cycle.svg";
import operateIcon from "./assets/operate.svg";
import parallelIcon from "./assets/parallel.svg";
import { PasteOutlined } from "@applet/icons";

export const AddButton: FC<{
    onAddBranch(): void;
    onAddStep(): void;
    onAddLoop(): void;
    onPasteStep?(): void
    onAddParallel?(): void
}> = ({ onAddBranch, onAddStep, onPasteStep, onAddLoop, onAddParallel }) => {
    const { stepToCopy } = useContext(EditorContext);
    const [visible, setVisible] = useState(false);
    const t = useTranslate();
    const loopContext = useContext(LoopContext);
    const { platform } = useContext(MicroAppContext);

    return (
      <Popover
        content={
          <Space
            className={styles.addButtonGroup}
            onClick={() => setVisible(false)}
          >
            {stepToCopy ? (
              <div className={styles.addButtonGroupItem} onClick={onPasteStep}>
                <PasteOutlined className={styles.addButtonGroupItemIcon} />
                <div className={styles.addButtonGroupItemLabel}>
                  {t("action.paste", "粘贴到此处")}
                </div>
              </div>
            ) : null}
            <div className={styles.addButtonGroupItem} onClick={onAddStep}>
              <img
                src={operateIcon}
                alt="icon"
                className={styles.addButtonGroupItemIcon}
              />
              <div className={styles.addButtonGroupItemLabel}>
                {t("editor.addButton.action", "操作")}
              </div>
            </div>
            <div className={styles.addButtonGroupItem} onClick={onAddBranch}>
              <Tooltip
                placement="top"
                title={t("editor.addButton.branchesTips")}
              >
                <img
                  src={brancheIcon}
                  alt="icon"
                  className={styles.addButtonGroupItemIcon}
                />
                <div className={styles.addButtonGroupItemLabel}>
                  {t("editor.addButton.branches", "条件分支")}
                </div>
              </Tooltip>
            </div>
            {platform !== 'operator' && (
              <div className={styles.addButtonGroupItem} onClick={onAddParallel}>
                <Tooltip
                  placement="top"
                  title={t("editor.addButton.parallelTips")}
                >
                  <img
                    src={parallelIcon}
                    alt="icon"
                    className={styles.addButtonGroupItemIcon}
                  />
                  <div className={styles.addButtonGroupItemLabel}>
                    {t("editor.addButton.parallel", "并行分支")}
                  </div>
                </Tooltip>
              </div>
            )}
            {loopContext.nest > 0 ? null : (
              <div className={styles.addButtonGroupItem} onClick={onAddLoop}>
                <img
                  src={cycleIcon}
                  alt="icon"
                  className={styles.addButtonGroupItemIcon}
                />
                <div className={styles.addButtonGroupItemLabel}>
                  {t("editor.addButton.loop", "循环")}
                </div>
              </div>
            )}
          </Space>
        }
        showArrow={false}
        placement="right"
        open={visible}
        onOpenChange={setVisible}
        transitionName=""
      >
        <PlusCircleOutlined
          data-testid="editor-add-button"
          className={styles.addButton}
        />
      </Popover>
    );
};
