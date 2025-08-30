import { useMemo } from 'react';
import type { Post } from '../../types';
import { minutesAgo } from '../../lib/time';

interface StatsPanelProps {
  posts: Post[];
}

export function StatsPanel({ posts }: StatsPanelProps) {
  const { ppm, buckets } = useMemo(() => {
    const now = Date.now();
    const recent = posts.filter((p) => minutesAgo(p.createdAt, now) <= 5);
    const buckets: number[] = new Array(5).fill(0);
    for (const p of recent) {
      const m = minutesAgo(p.createdAt, now);
      const idx = Math.min(4, Math.max(0, 4 - m));
      buckets[idx]++;
    }
    const ppm = recent.length / 5;
    return { ppm, buckets };
  }, [posts]);

  return (
    <section className="card p-3">
      <h3 className="mb-2 text-sm font-semibold tracking-tight">Stats</h3>
      <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{ppm.toFixed(1)} posts/min</div>
      <div className="mt-2 flex h-8 items-end gap-1">
        {buckets.map((v: number, i: number) => (
          <div key={i} className="flex-1 rounded bg-brand-red/20" style={{ height: `${Math.min(100, v * 12)}%` }} />
        ))}
      </div>
    </section>
  );
}

export default StatsPanel;


