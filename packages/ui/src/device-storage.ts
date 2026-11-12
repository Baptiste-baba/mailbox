/**
 * What the interface remembers on this device, such as the widths of the columns. The browser may
 * refuse storage (private window, blocked site data): nothing is then remembered, and everything
 * starts as it would the first time.
 */
export const deviceStorage: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Not remembered on this device: the choice still holds for this session.
    }
  },
};
