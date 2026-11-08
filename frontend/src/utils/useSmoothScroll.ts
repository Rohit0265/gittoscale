import { useEffect, useRef } from 'react';

export interface SmoothScrollOptions {
  /** Damping factor between 0.04 (ultra-smooth) and 0.15 (crisp). Default: 0.09 */
  lerp?: number;
  /** Whether smooth scrolling is enabled. Default: true */
  enabled?: boolean;
  /** Custom scroll target container ref (defaults to window/document) */
  targetRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Checks whether the mouse event occurred inside a nested scrollable element
 * (e.g., dropdown, modal, code block, comment drawer) so we don't hijack its scroll.
 */
function isInsideScrollableChild(target: EventTarget | null, root: HTMLElement | Window): boolean {
  if (!(target instanceof HTMLElement)) return false;

  let current: HTMLElement | null = target;
  const rootElement = root === window ? document.documentElement : (root as HTMLElement);

  while (current && current !== rootElement) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const isScrollable =
      (overflowY === 'auto' || overflowY === 'scroll') &&
      current.scrollHeight > current.clientHeight;

    if (isScrollable) {
      return true;
    }
    current = current.parentElement;
  }

  return false;
}

export function useSmoothScroll(options: SmoothScrollOptions = {}) {
  const { lerp = 0.09, enabled = true, targetRef } = options;
  const stateRef = useRef<{
    currentY: number;
    targetY: number;
    rafId: number | null;
    isScrolling: boolean;
  }>({
    currentY: 0,
    targetY: 0,
    rafId: null,
    isScrolling: false,
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Respect user's motion preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // On touch-only mobile devices, native glass touch scrolling is already optimal
    const isTouchDevice = 'ontouchstart' in window && navigator.maxTouchPoints > 0;
    if (isTouchDevice && window.innerWidth < 768) return;

    const targetEl = targetRef ? targetRef.current : null;
    const scrollTarget = targetEl || window;

    const getScrollTop = (): number => {
      if (targetEl) return targetEl.scrollTop;
      return window.scrollY || document.documentElement.scrollTop || 0;
    };

    const getMaxScroll = (): number => {
      if (targetEl) return Math.max(0, targetEl.scrollHeight - targetEl.clientHeight);
      return Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };

    const setScrollTop = (val: number) => {
      if (targetEl) {
        targetEl.scrollTop = val;
      } else {
        window.scrollTo({ top: val, behavior: 'instant' as ScrollBehavior });
      }
    };

    const state = stateRef.current;
    state.currentY = getScrollTop();
    state.targetY = state.currentY;

    const update = () => {
      const diff = state.targetY - state.currentY;

      if (Math.abs(diff) > 0.4) {
        state.currentY += diff * lerp;
        setScrollTop(state.currentY);
        state.rafId = requestAnimationFrame(update);
      } else {
        state.currentY = state.targetY;
        setScrollTop(state.currentY);
        state.isScrolling = false;
        state.rafId = null;
      }
    };

    const startAnimation = () => {
      if (!state.rafId) {
        state.isScrolling = true;
        state.rafId = requestAnimationFrame(update);
      }
    };

    // Wheel listener
    const onWheel = (e: WheelEvent) => {
      // Don't intercept ctrl-wheel (browser zoom) or horizontal wheel
      if (e.ctrlKey || e.metaKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;

      // Don't hijack if user is scrolling inside an inner dropdown/modal/drawer
      if (isInsideScrollableChild(e.target, scrollTarget)) return;

      e.preventDefault();

      const maxScroll = getMaxScroll();
      // Normalize wheel delta (handles line vs pixel mode)
      const delta = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY;

      state.targetY = Math.max(0, Math.min(maxScroll, state.targetY + delta));
      startAnimation();
    };

    // Sync state when user uses native scrollbar drag or keyboard navigation
    const onSyncScroll = () => {
      if (!state.isScrolling) {
        state.currentY = getScrollTop();
        state.targetY = state.currentY;
      }
    };

    // Keyboard navigation (PageUp, PageDown, Space, Up, Down, Home, End)
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in form inputs
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
        return;
      }

      let keyDelta = 0;
      const pageStep = (targetEl ? targetEl.clientHeight : window.innerHeight) * 0.8;

      if (e.key === 'ArrowDown') keyDelta = 80;
      else if (e.key === 'ArrowUp') keyDelta = -80;
      else if (e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) keyDelta = pageStep;
      else if (e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) keyDelta = -pageStep;
      else if (e.key === 'Home') keyDelta = -getMaxScroll();
      else if (e.key === 'End') keyDelta = getMaxScroll();

      if (keyDelta !== 0) {
        e.preventDefault();
        const maxScroll = getMaxScroll();
        state.targetY = Math.max(0, Math.min(maxScroll, state.targetY + keyDelta));
        startAnimation();
      }
    };

    const eventOptions: AddEventListenerOptions = { passive: false };

    if (targetEl) {
      targetEl.addEventListener('wheel', onWheel, eventOptions);
      targetEl.addEventListener('scroll', onSyncScroll, { passive: true });
    } else {
      window.addEventListener('wheel', onWheel, eventOptions);
      window.addEventListener('scroll', onSyncScroll, { passive: true });
    }

    window.addEventListener('keydown', onKeyDown, { passive: false });

    return () => {
      if (state.rafId) {
        cancelAnimationFrame(state.rafId);
        state.rafId = null;
      }
      if (targetEl) {
        targetEl.removeEventListener('wheel', onWheel);
        targetEl.removeEventListener('scroll', onSyncScroll);
      } else {
        window.removeEventListener('wheel', onWheel);
        window.removeEventListener('scroll', onSyncScroll);
      }
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [enabled, lerp, targetRef]);
}
