// 临时类型定义，将在后续创建完整的扩展后更新
export interface MarkMarkdownStorage {
  markdown: {
    parser: any;
    serializer: any;
    hooks?: any;
  };
}

export interface NodeMarkdownStorage {
  markdown: {
    parser: any;
    serializer: any;
    hooks?: any;
  };
}

export interface FloatMenuItemStorage {
  floatMenu?: {
    hide?: boolean;
    items?: any;
  };
}

export interface BlockMenuItemStorage {
  blockMenu?: {
    hide?: boolean;
    items?: any;
  };
}

export interface ClickMenuItemStorage {
  clickMenu?: {
    hide?: boolean;
    items?: any;
  };
}

