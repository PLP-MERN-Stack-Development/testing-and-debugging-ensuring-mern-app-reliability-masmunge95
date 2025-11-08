import { renderHook } from '@testing-library/react';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock the underlying smoothScrollTo function
jest.unstable_mockModule('@/hooks/animation', () => ({
  smoothScrollTo: jest.fn(),
}));

describe('useSmoothScroll Custom Hook', () => {
  let useSmoothScroll;
  let smoothScrollTo;

  beforeEach(async () => {
    // Dynamically import after mocking
    const smoothScrollHookModule = await import('@/hooks/UseSmoothScroll');
    useSmoothScroll = smoothScrollHookModule.useSmoothScroll;
    const animationModule = await import('@/hooks/animation');
    smoothScrollTo = animationModule.smoothScrollTo;

    jest.resetAllMocks();
  });

  it('should return a scroll function', () => {
    const { result } = renderHook(() => useSmoothScroll());
    expect(typeof result.current).toBe('function');
  });

  it('should call smoothScrollTo with correct arguments', () => {
    const { result } = renderHook(() => useSmoothScroll());
    const mockElement = document.createElement('div');
    const mockOnComplete = jest.fn();

    result.current(mockElement, 500, mockOnComplete, 100);

    expect(smoothScrollTo).toHaveBeenCalledWith(mockElement, 500, mockOnComplete, 100);
    expect(smoothScrollTo).toHaveBeenCalledTimes(1);
  });
});