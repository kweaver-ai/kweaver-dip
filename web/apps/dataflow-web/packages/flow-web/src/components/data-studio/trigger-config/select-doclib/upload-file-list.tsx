import { Button, message, Typography } from "antd";
import { API, useTranslate } from "@applet/common";
import { CloseOutlined, PlusOutlined } from "@applet/icons";
import styles from "../../../as-file-select/as-file-select.module.less";
import { VirtualTable } from "../../../virtual-table/virtual-table";
import { useCustomExecutorErrorHandler } from "../../../custom-executor/errors";
import { Thumbnail } from "../../../thumbnail";

export interface DocLibItem {
    key?: string;
    size?: string;
    name?: string;
}

interface DocLibListProps {
    data: DocLibItem[];
    onAdd(): void;
    onChange(value: DocLibItem[]): void;
    apiId: string;
}

export const UploadFileList = ({
    data,
    onAdd,
    onChange,
    apiId,
}: DocLibListProps) => {
    const t = useTranslate();
    const handleError = useCustomExecutorErrorHandler();

    const handleDelete = async (key: string) => {
        try {
            await API.axios.delete(
                `/api/automation/v1/data-flow/${apiId}/files?key=${key}`,
            );
        } catch (e) {
            handleError(e);
        }

        const newData = data?.filter((item) => item.key !== key);
        onChange?.(newData);
    };

    const columns: any = [
        {
            dataIndex: "name",
            render: (text: string, record: any) => {
                const { id, name } = record;
                return (
                    <div className={styles["doc-name-wrapper"]}>
                        <Thumbnail
                            doc={record}
                            className={styles["doc-icon"]}
                        />

                        <Typography.Text
                            ellipsis
                            className={styles["doc-name"]}
                            title={name}
                        >
                            {name}
                        </Typography.Text>
                    </div>
                );
            },
        },
        {
            dataIndex: "key",
            width: 32,
            render: (key: string) => (
                <CloseOutlined
                    title={t("delete", "删除")}
                    className={styles["delete-icon"]}
                    onClick={() => {
                        handleDelete(key);
                    }}
                />
            ),
        },
    ];

    return (
        <div className={styles["list-container"]}>
            <VirtualTable
                columns={columns}
                bordered={false}
                dataSource={data}
                rowKey="id"
                scroll={{
                    y: data?.length < 5 ? data.length * 50 : 250,
                }}
                showHeader={false}
                className={styles["table-list"]}
                locale={{
                    emptyText: <div />,
                }}
            />
            <Button type="link" icon={<PlusOutlined />} onClick={() => onAdd()}>
                {t("datastudio.upload.file.addMore", "上传更多本地文档")}
            </Button>
        </div>
    );
};
