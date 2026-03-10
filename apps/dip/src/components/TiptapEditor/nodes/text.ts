import { Text as TText } from "@tiptap/extension-text";

export const Text = TText.extend({
  name: "text",
  addStorage() {
    return {
      ...this.parent?.(),
      markdown: {
        parser: {
          match: ({ type }: any) => type === "text",
          apply: (state: any, node: any) => {
            state.addText(node.value);
          },
        },
        serializer: {
          match: (node: any) => node.type.name === this.name,
          apply: (state: any, node: any) => {
            state.addNode({
              type: "text",
              value: node.text,
            });
          },
        },
      },
    };
  },
});

