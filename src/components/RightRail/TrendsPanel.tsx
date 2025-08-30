import { useMemo } from 'react';
import type { Post } from '../../types';

interface TrendsPanelProps {
  posts: Post[];
}

export function TrendsPanel({ posts }: TrendsPanelProps) {
  const topHashtags: Array<[string, number]> = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of posts) {
      for (const tag of p.hashtags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [posts]);

  return (
    <section className="card p-3">
      <h3 className="mb-2 text-sm font-semibold tracking-tight">Trends</h3>
      <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
      <ul className="mt-2 space-y-2 text-sm">
        {topHashtags.length === 0 && <li className="text-slate-500">No trends yet</li>}
        {topHashtags.map(([tag, count]) => (
          <li key={tag} className="flex items-center justify-between">
            <span className="truncate">#{tag}</span>
            <span className="text-slate-500">{count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default TrendsPanel;


