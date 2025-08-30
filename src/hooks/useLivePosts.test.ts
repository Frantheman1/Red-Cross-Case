import { renderHook, act } from '@testing-library/react';
import { useLivePosts } from './useLivePosts';
import type { Post } from '../types';

class MockWebSocket {
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  static instances: MockWebSocket[] = [];
  constructor(url: string) {
    this.url = url;
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }
  close() {
    this.onclose?.();
  }
  send() {}
}

(globalThis as any).WebSocket = MockWebSocket as any;

const sample: Post = {
  id: 'p1',
  platform: 'mastodon',
  author: { name: 'Bob', handle: 'bob' },
  text: 'Test',
  createdAt: new Date().toISOString(),
  url: 'https://example.com',
  hashtags: [],
};

describe('useLivePosts', () => {
  it('buffers pending and reveal flow is handled by caller', async () => {
    const received: Post[] = [];
    const { result } = renderHook(() => useLivePosts({ onPost: (p) => received.push(p), qsString: '' }));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(result.current.connected).toBe(true);

    await act(async () => {
      MockWebSocket.instances[0]?.onmessage?.({ data: JSON.stringify(sample) });
    });

    expect(received).toHaveLength(1);
  });
});


