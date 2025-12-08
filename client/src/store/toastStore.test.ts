import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useToastStore } from './toastStore';

describe('ToastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('adds a toast', () => {
    const { addToast, toasts } = useToastStore.getState();

    addToast({
      type: 'success',
      message: 'Test toast',
      duration: 3000
    });

    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test toast');
    expect(toasts[0].type).toBe('success');
  });

  it('removes a toast by id', () => {
    const { addToast, removeToast, toasts: initialToasts } = useToastStore.getState();

    addToast({ type: 'info', message: 'Test' });
    const toastId = useToastStore.getState().toasts[0].id;

    removeToast(toastId);

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('clears all toasts', () => {
    const { addToast, clearAll } = useToastStore.getState();

    addToast({ type: 'info', message: 'Test 1' });
    addToast({ type: 'success', message: 'Test 2' });

    expect(useToastStore.getState().toasts).toHaveLength(2);

    clearAll();

    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('generates unique IDs for toasts', () => {
    const { addToast } = useToastStore.getState();

    addToast({ type: 'info', message: 'Test 1' });
    addToast({ type: 'info', message: 'Test 2' });

    const toasts = useToastStore.getState().toasts;
    expect(toasts[0].id).not.toBe(toasts[1].id);
  });
});
