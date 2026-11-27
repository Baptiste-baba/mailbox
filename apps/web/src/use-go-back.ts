import { useCanGoBack, useRouter } from '@tanstack/react-router';

/**
 * Goes back to the previous screen of the app, as the back button of the browser does, so that the
 * history does not grow with every return. Opened from its address alone, with nothing before it,
 * the screen leaves through `fallback` instead.
 */
export function useGoBack(fallback: () => void): () => void {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return () => {
    if (canGoBack) {
      router.history.back();
    } else {
      fallback();
    }
  };
}
