/**
 * Fixed marker used to start hidden attachment context block.
 */
export const HIDDEN_ATTACHMENT_CONTEXT_START = "<!-- DIP_HIDDEN_ATTACHMENTS_START -->";

/**
 * Fixed marker used to end hidden attachment context block.
 */
export const HIDDEN_ATTACHMENT_CONTEXT_END = "<!-- DIP_HIDDEN_ATTACHMENTS_END -->";

/**
 * Builds one fixed hidden attachment context block.
 *
 * @param paths Uploaded file paths.
 * @returns Serialized hidden block.
 */
export function buildHiddenAttachmentContextBlock(paths: string[]): string {
  const numbered = paths.map((path, index) => `${index + 1}. ${path}`);

  return [
    HIDDEN_ATTACHMENT_CONTEXT_START,
    "ATTACHMENT_PATHS:",
    ...numbered,
    "ATTACHMENT_INSTRUCTION:",
    "You must read every listed file path using available file-reading tools before answering the user.",
    "If any file cannot be read, explicitly report which path failed and why.",
    HIDDEN_ATTACHMENT_CONTEXT_END
  ].join("\n");
}

/**
 * Removes hidden attachment context block from one text payload.
 *
 * @param text Raw message text.
 * @returns Text without hidden context block.
 */
export function stripHiddenAttachmentContextBlock(text: string): string {
  const startIndex = text.indexOf(HIDDEN_ATTACHMENT_CONTEXT_START);
  if (startIndex < 0) {
    return text;
  }

  const endIndex = text.indexOf(HIDDEN_ATTACHMENT_CONTEXT_END, startIndex);
  if (endIndex < 0) {
    return text;
  }

  const before = text.slice(0, startIndex).replace(/\n{3,}$/g, "\n\n").trimEnd();
  const after = text
    .slice(endIndex + HIDDEN_ATTACHMENT_CONTEXT_END.length)
    .replace(/^\s*\n+/g, "");

  if (before === "") {
    return after;
  }

  if (after === "") {
    return before;
  }

  return `${before}\n\n${after}`;
}
