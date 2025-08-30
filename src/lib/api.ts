import type { Post } from '../types';

const API_BASE = import.meta.env?.VITE_API_BASE ?? 'http://localhost:8080/api';

export interface ListPostsParams {
  since?: string;
  limit?: number;
  q?: string;
  platform?: 'mastodon';
  lang?: string;
  sort?: 'newest' | 'most_rt';
  tag?: string[];
  local?: boolean | string;
}

export interface ListPostsResponse {
  items: Post[];
  nextCursor?: string;
}

export async function listPosts(params: ListPostsParams = {}): Promise<ListPostsResponse> {
  const url = new URL(`${API_BASE}/posts`, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((val) => url.searchParams.append(k, String(val)));
    } else if (typeof v === 'boolean') {
      url.searchParams.set(k, v ? 'true' : 'false');
    } else {
      url.searchParams.set(k, String(v));
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch posts: ${res.status}`);
  }
  const data = (await res.json()) as ListPostsResponse;
  return data;
}


