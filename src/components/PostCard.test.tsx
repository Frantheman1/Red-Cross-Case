import { render, screen } from '@testing-library/react';
import { PostCard } from './PostCard';
import type { Post } from '../types';

const base: Post = {
  id: '1',
  platform: 'mastodon',
  author: { name: 'Alice', handle: 'alice' },
  text: 'Hello world',
  createdAt: new Date().toISOString(),
  url: 'https://example.com',
  hashtags: ['Hello', 'World'],
};

describe('PostCard', () => {
  it('renders name, handle, time, platform, hashtags, and link', () => {
    render(<PostCard post={base} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
    expect(screen.getByText('mastodon')).toBeInTheDocument();
    expect(screen.getByText('#Hello')).toBeInTheDocument();
    expect(screen.getByText('#World')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Open post/i });
    expect(link).toHaveAttribute('rel', 'noreferrer');
  });
});


