import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listPosts } from './lib/api';
import type { Post } from './types';
import Header from './components/Header';
import Filters from './components/Filters';
import PostCard from './components/PostCard';
import { NewPostsToast } from './components/NewPostsToast';
import { TrendsPanel } from './components/RightRail/TrendsPanel';
import { StatsPanel } from './components/RightRail/StatsPanel';
import { useLivePosts } from './hooks/useLivePosts';
import { useQueryState } from './hooks/useQueryState';
import { z } from 'zod';

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pending, setPending] = useState<Post[]>([]);

  const { values } = useQueryState(
    {
      since: z.string().optional(),
      limit: z.coerce.number().optional(),
      q: z.string().optional(),
      platform: z.enum(['mastodon']).optional(),
      lang: z.string().optional(),
      sort: z.enum(['newest', 'most_rt']).optional(),
      local: z.union([z.literal('true'), z.literal('false')]).optional(),
      tag: z.array(z.string()).optional(),
    },
    { arrayKeys: ['tag'] }
  );

  const params = useMemo(() => {
    return {
      since: values.since,
      limit: values.limit ?? 40,
      q: values.q,
      platform: values.platform,
      lang: values.lang,
      sort: values.sort ?? 'newest',
      tag: values.tag ?? [],
      local: values.local ?? 'true',
    } as const;
  }, [values]);

  const query = useQuery<Post[], Error>({
    queryKey: ['posts', params],
    queryFn: async () => {
      const res = await listPosts(params as unknown as Parameters<typeof listPosts>[0]);
      return res.items;
    },
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      setPosts(query.data as Post[]);
    }
  }, [query.data]);

  const qsString = useMemo(() => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.lang) qs.set('lang', params.lang);
    if (params.local !== undefined) qs.set('local', String(params.local));
    if (params.tag && params.tag.length) params.tag.forEach((t) => qs.append('tag', t));
    if (params.platform) qs.set('platform', params.platform);
    return qs.toString();
  }, [params]);

  const onLivePost = useCallback(
    (incoming: Post) => {
      const existsInPosts = posts.some((existing: Post) => existing.id === incoming.id);
      const existsInPending = pending.some((existing: Post) => existing.id === incoming.id);
      if (existsInPosts || existsInPending) return;
      setPosts((current: Post[]) => [incoming, ...current]);
    },
    [posts, pending]
  );

  const { connected, reconnect } = useLivePosts({ onPost: onLivePost, qsString });

  useEffect(() => {
    reconnect();
  }, [qsString, reconnect]);

  const revealPending = useCallback(() => {
    setPosts((current: Post[]) => [...pending, ...current]);
    setPending([]);
  }, [pending]);

  const sortedPosts = useMemo(() => {
    if (params.sort === 'most_rt') {
      return [...posts].sort((a, b) => (b.metrics?.reposts ?? 0) - (a.metrics?.reposts ?? 0));
    }
    return [...posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [posts, params.sort]);

  return (
    <div className="min-h-full bg-gray-50 text-gray-900 dark:bg-black dark:text-gray-100">
      <Header connected={connected} />
      <Filters />
      <main className="mx-auto grid max-w-[1100px] grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {sortedPosts.map((p: Post) => (
            <PostCard key={p.id} post={p} />
          ))}
          <NewPostsToast count={pending.length} onReveal={revealPending} />
        </div>
        <div className="hidden gap-3 md:flex md:flex-col">
          <TrendsPanel posts={sortedPosts} />
          <StatsPanel posts={sortedPosts} />
        </div>
      </main>
    </div>
  );
}


