export interface IconDefinition {
  name: string;
  source: string;
  kind?: "script" | "svg" | "component";
}

export const iconRegistry: IconDefinition[] = [];

export function defineIcon(icon: IconDefinition) {
  iconRegistry.push(icon);
  return icon;
}
