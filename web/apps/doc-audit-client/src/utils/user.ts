import { apis, components } from '@aishu-tech/components/dist/dip-components.min';

export const selectUser = ({
  range,
  tabs,
  title,
  isAdmin,
  isSelectOwn,
  multiple,
}: {
  range: string[];
  tabs: string[];
  title: string;
  isAdmin: boolean;
  isSelectOwn: boolean;
  multiple: boolean;
}): Promise<any[]> => {
  return new Promise(resolve => {
    const unmount = apis.mountComponent(
      components.AccessorPicker,
      {
        range,
        tabs,
        title,
        isAdmin,
        isSelectOwn,
        multiple,
        onSelect: (selections: unknown[]) => {
          resolve(selections || []);
          unmount?.();
        },
        onCancel: () => {
          resolve([]);
          unmount?.();
        },
      },
      document.createElement('div')
    );
  });
};
