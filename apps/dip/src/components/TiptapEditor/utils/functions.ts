import { AnyExtension, Extension, Mark, Node } from "@tiptap/core";

export function debounce<A extends any[]>(delay: number, apply: (...args: A) => void) {
  let timer: number | undefined;
  return (...args: A) => {
    clearTimeout(timer);
    timer = setTimeout(() => apply(...args), delay) as unknown as number;
  };
}

export function configure<O = any>(
  extensions: Array<AnyExtension>,
  node: Extension<O> | Node<O> | Mark<O>,
  options?: Partial<O> | boolean,
  overwrite?: Partial<O>,
) {
  if (options !== false) {
    if (typeof options === "boolean") {
      extensions.push(node.configure(overwrite));
    } else {
      extensions.push(node.configure({ ...overwrite, ...options }));
    }
  }
}

