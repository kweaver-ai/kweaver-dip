import { Document as TDocument } from "@tiptap/extension-document";

export const Document = TDocument.extend({
  name: "doc",
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: (node: any) => node.type === "root",
          apply: (state: any, node: any, type: any) => {
            state.openNode(type);
            state.next(node.children);
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.openNode({ type: "root" });
            state.next(node.content);
          },
        },
      },
    };
  },
});

