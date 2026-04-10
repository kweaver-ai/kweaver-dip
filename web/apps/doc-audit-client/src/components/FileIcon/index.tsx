import {
  FileOutlined,
  FolderOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileZipOutlined,
  VideoCameraOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import { getFileExtension } from '@/utils/file';
import styles from './index.module.less';

interface FileIconProps {
  fileName?: string;
  docType?: 'file' | 'folder';
  size?: number;
  className?: string;
}

const FILE_ICON_MAP: Record<string, React.ReactNode> = {
  // 图片
  jpg: <FileImageOutlined />,
  jpeg: <FileImageOutlined />,
  png: <FileImageOutlined />,
  gif: <FileImageOutlined />,
  bmp: <FileImageOutlined />,
  svg: <FileImageOutlined />,
  webp: <FileImageOutlined />,
  // PDF
  pdf: <FilePdfOutlined />,
  // Word
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  // Excel
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
  csv: <FileExcelOutlined />,
  // PPT
  ppt: <FilePptOutlined />,
  pptx: <FilePptOutlined />,
  // 文本
  txt: <FileTextOutlined />,
  md: <FileTextOutlined />,
  json: <FileTextOutlined />,
  xml: <FileTextOutlined />,
  // 压缩包
  zip: <FileZipOutlined />,
  rar: <FileZipOutlined />,
  '7z': <FileZipOutlined />,
  tar: <FileZipOutlined />,
  gz: <FileZipOutlined />,
  // 视频
  mp4: <VideoCameraOutlined />,
  avi: <VideoCameraOutlined />,
  mov: <VideoCameraOutlined />,
  mkv: <VideoCameraOutlined />,
  wmv: <VideoCameraOutlined />,
  // 音频
  mp3: <CustomerServiceOutlined />,
  wav: <CustomerServiceOutlined />,
  flac: <CustomerServiceOutlined />,
  aac: <CustomerServiceOutlined />,
};

const FileIcon: React.FC<FileIconProps> = ({ fileName, docType = 'file', size = 24, className }) => {
  const getIcon = () => {
    if (docType === 'folder') {
      return <FolderOutlined />;
    }

    if (fileName) {
      const ext = getFileExtension(fileName);
      if (FILE_ICON_MAP[ext]) {
        return FILE_ICON_MAP[ext];
      }
    }

    return <FileOutlined />;
  };

  return (
    <span className={`${styles['file-icon']} ${className || ''}`} style={{ fontSize: size }}>
      {getIcon()}
    </span>
  );
};

export default FileIcon;
