import { deviceStorage } from '@mailbox/ui';
import { useState } from 'react';

const storageKey = 'compose.formatBar';

/**
 * Whether the formatting bar shows all of its options or only the common ones: folded the first
 * time, then as it was last left on this device.
 */
export function useFormatBarUnfolded() {
  const [unfolded, setUnfolded] = useState(() => deviceStorage.getItem(storageKey) === 'unfolded');
  const toggleUnfolded = () => {
    setUnfolded(!unfolded);
    deviceStorage.setItem(storageKey, unfolded ? 'folded' : 'unfolded');
  };
  return { unfolded, toggleUnfolded };
}
