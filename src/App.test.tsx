import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, act } from '@testing-library/react';
import App from './App';

vi.mock('./lib/api', () => ({
  listPosts: vi.fn().mockResolvedValue({ items: [
    {
      id: '1', 
      platform: 'mastodon', 
      author: { name: 'Alice', handle: 'alice' },
      text: 'Hello', 
      createdAt: new Date().toISOString(), 
      url: 'https://example.com', 
      hashtags: []
    },
  ] }),
}));

class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor() {
    MockWebSocket.instances.push(this);
    setTimeout(() => this.onopen?.(), 0);
  }
  send() {}
  close() { this.onclose?.(); }
}
(globalThis as any).WebSocket = MockWebSocket as any;

describe('App', () => {
  it('does initial REST fetch and inserts live WS post', async () => {
    const qc = new QueryClient();
    render(
      <QueryClientProvider client={qc}>
        <App />
      </QueryClientProvider>
    );
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    await act(async () => {
      MockWebSocket.instances[0]?.onmessage?.({ data: JSON.stringify({
        id: '2', 
        platform: 'mastodon', 
        author: { name: 'Bob', handle: 'bob' }, 
        text: 'WS', 
        createdAt: new Date().toISOString(), 
        url: '#', 
        hashtags: []
      }) });
    });
    expect(await screen.findByText('Bob')).toBeInTheDocument();
  });
});