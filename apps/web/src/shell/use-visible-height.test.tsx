import { afterEach, describe, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import '../styles.css';
import { useVisibleHeight } from './use-visible-height.ts';

/** What Safari reports of the screen: the visible area shrinks as the keyboard opens. */
class FakeVisualViewport extends EventTarget {
  height = 844;
  scale = 1;
  offsetTop = 0;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

function visibleHeight(): string {
  return document.documentElement.style.getPropertyValue('--visible-height');
}

function visibleTop(): string {
  return document.documentElement.style.getPropertyValue('--visible-top');
}

function keyboardOpen(): boolean {
  return document.documentElement.hasAttribute('data-keyboard');
}

describe('visible height', () => {
  test('follows the room the keyboard leaves on screen', async () => {
    const viewport = new FakeVisualViewport();
    vi.stubGlobal('visualViewport', viewport);
    await renderHook(() => useVisibleHeight());
    expect(visibleHeight()).toBe('844px');

    viewport.height = 508;
    viewport.dispatchEvent(new Event('resize'));

    expect(visibleHeight()).toBe('508px');
  });

  test('keeps the height of the page while zooming in', async () => {
    const viewport = new FakeVisualViewport();
    vi.stubGlobal('visualViewport', viewport);
    await renderHook(() => useVisibleHeight());

    viewport.height = 422;
    viewport.scale = 2;
    viewport.dispatchEvent(new Event('resize'));

    expect(visibleHeight()).toBe('844px');
  });
});

describe('visible height and the home bar', () => {
  test('lets the foot of the screen sit on the keyboard, which covers the home bar', async () => {
    const viewport = new FakeVisualViewport();
    vi.stubGlobal('visualViewport', viewport);
    await renderHook(() => useVisibleHeight());
    expect(keyboardOpen()).toBe(false);

    viewport.height = 508;
    viewport.dispatchEvent(new Event('resize'));
    expect(keyboardOpen()).toBe(true);
    expect(getComputedStyle(document.documentElement).getPropertyValue('--screen-bottom')).toBe(
      '0px',
    );

    viewport.height = 844;
    viewport.dispatchEvent(new Event('resize'));
    expect(keyboardOpen()).toBe(false);
  });

  test('follows the page down as iOS slides it up to show the cursor, but not while zoomed', async () => {
    const viewport = new FakeVisualViewport();
    vi.stubGlobal('visualViewport', viewport);
    await renderHook(() => useVisibleHeight());

    viewport.height = 508;
    viewport.offsetTop = 120;
    viewport.dispatchEvent(new Event('scroll'));
    expect(visibleTop()).toBe('120px');

    viewport.scale = 2;
    viewport.dispatchEvent(new Event('scroll'));
    expect(visibleTop()).toBe('0px');
  });

  test('lets the page go once the phone layout is left', async () => {
    vi.stubGlobal('visualViewport', new FakeVisualViewport());
    const { unmount } = await renderHook(() => useVisibleHeight());

    await unmount();

    expect(visibleHeight()).toBe('');
  });
});
