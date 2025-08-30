import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import type { Post } from './types';
import Filter from 'leo-profanity';

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/stream' });

const INSTANCE = process.env.MASTODON_INSTANCE || 'mastodon.social';
const REST_BASE = `https://${INSTANCE}`;
const ACCESS_TOKEN = process.env.MASTODON_ACCESS_TOKEN || '';

const streamingBaseCache = new Map<string, string>();
async function discoverStreamingBase(instance: string): Promise<string> {
  const cached = streamingBaseCache.get(instance);
  if (cached) return cached;
  const probe = `https://${instance}/api/v1/streaming`;
  try {
    const resp = await fetch(probe, { method: 'GET', redirect: 'manual' as any });
    const location = (resp.headers as any).get?.('location') || (resp as any).headers?.get?.('location');
    if (resp.status >= 300 && resp.status < 400 && location) {
      const u = new URL(location);
      const base = `wss://${u.host}/api/v1/streaming`;
      streamingBaseCache.set(instance, base);
      return base;
    }
  } catch {}
  const fallback = `wss://${instance}/api/v1/streaming`;
  streamingBaseCache.set(instance, fallback);
  return fallback;
}

function mapStatus(s: any): Post {
  const tags = (s.tags || []).map((t: any) => t.name).filter(Boolean);
  const media = (s.media_attachments || []).map((m: any) => ({
    type: m.type === 'video' ? 'video' : 'image',
    thumbUrl: m.preview_url,
  }));
  const acct = s.account || {};
  const text = (s.content || '').replace(/<[^>]*>/g, '').trim(); 
  const cleanText = Filter.clean(text);
  return {
    id: String(s.id),
    platform: 'mastodon',
    author: {
      name: acct.display_name || acct.username || 'Unknown',
      handle: acct.acct || acct.username || 'unknown',
      avatarUrl: acct.avatar,
    },
    text: cleanText,
    createdAt: s.created_at,
    url: s.url || `${REST_BASE}/@${acct.acct}/${s.id}`,
    media,
    hashtags: tags,
    metrics: { reposts: s.reblogs_count, likes: s.favourites_count },
  };
}

async function buildStreamUrl(params: URLSearchParams) {
  const base = await discoverStreamingBase(INSTANCE || 'mastodon.social');
  const local = String(params.get('local') || 'false') === 'true';
  const tags = params.getAll('tag').map(t => t.toLowerCase()).filter(Boolean);
  const bannedQuery = (process.env.BANNED_WORDS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const stream = tags.length === 1
    ? (local ? 'hashtag:local' : 'hashtag')
    : (local ? 'public:local' : 'public');
  let url = `${base}?stream=${stream}`;
  if (tags.length === 1) url += `&tag=${encodeURIComponent(tags[0])}`;
  if (ACCESS_TOKEN) url += `&access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
  return url;
}
  
app.get('/api/posts', async (req, res) => {
    try {
      const limit = Number(req.query.limit ?? 40);
      const since = req.query.since ? Date.parse(String(req.query.since)) : undefined;
      const q = (req.query.q as string | undefined)?.toLowerCase();
      const lang = (req.query.lang as string | undefined)?.toLowerCase();
      const tags = ([] as string[]).concat(req.query.tag || []).map(String).map(t => t.toLowerCase()).filter(Boolean);
      const local = String(req.query.local || 'false') === 'true';
  
      const url = new URL(`${REST_BASE}/api/v1/timelines/public`);
      url.searchParams.set('limit', String(Math.min(limit, 80)));
      if (local) url.searchParams.set('local', 'true');
  
      const raw = await fetch(url.toString()).then(r => r.json());
      let filtered = raw as any[];
      if (since) filtered = filtered.filter(s => Date.parse(s.created_at) >= since);
      if (lang) filtered = filtered.filter(s => (s.language || '').toLowerCase() === lang);
      if (tags.length) filtered = filtered.filter(s => (s.tags || []).some((t: any) => tags.includes(String(t.name || '').toLowerCase())));

      let items: Post[] = filtered.map(mapStatus);
      if (q) items = items.filter(p => p.text.toLowerCase().includes(q) || p.hashtags.some(h => `#${h.toLowerCase()}`.includes(q)));
  
      res.json({ items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'failed_to_fetch' });
    }
  });
  
const upstreamPool = new Map<string, WebSocket>();

function ensureUpstream(streamUrl: string) {
  let up = upstreamPool.get(streamUrl);
  if (up && up.readyState === WebSocket.OPEN) return up;
  if (ACCESS_TOKEN) {
    up = new WebSocket(streamUrl, undefined as any, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } } as any);
  } else {
    up = new WebSocket(streamUrl);
  }
  upstreamPool.set(streamUrl, up);
  up.on('open', () => console.log('Upstream connected:', streamUrl));
  up.on('close', () => {
    console.log('Upstream closed:', streamUrl);
    upstreamPool.delete(streamUrl);
  });
  up.on('error', err => console.error('Upstream error', streamUrl, err));
  return up;
}

wss.on('connection', (ws, req) => {
  (async () => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const params = url.searchParams;

    const q = (params.get('q') || '').toLowerCase();
    const lang = (params.get('lang') || '').toLowerCase();
    const tags = params.getAll('tag').map(t => t.toLowerCase());

    const streamUrl = await buildStreamUrl(params);
    const upstream = ensureUpstream(streamUrl);

    const forward = (post: Post, rawStatus: any) => {
      const statusLang = (rawStatus?.language || '').toLowerCase();
      if (lang && statusLang !== lang) return;
      if (tags.length && !post.hashtags.some(h => tags.includes(h.toLowerCase()))) return;

      const banned = (process.env.BANNED_WORDS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (banned.length) {
        const lowered = post.text.toLowerCase();
        if (banned.some(w => w && lowered.includes(w))) return;
      }
      if (q) {
        const hit = post.text.toLowerCase().includes(q) ||
          post.hashtags.some(h => `#${h.toLowerCase()}`.includes(q));
        if (!hit) return;
      }
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(post));
    };

    
    const onUpstreamMessage = (buf: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(buf.toString());
        if (msg.event === 'update') {
          const status = JSON.parse(msg.payload);
          forward(mapStatus(status), status);
        }
      } catch {}
    };

    upstream.on('message', onUpstreamMessage);
  })();
});


const port = Number(process.env.PORT || 8080);
server.listen(port, () =>
  console.log(`API+WS listening on http://localhost:${port}`)
);
