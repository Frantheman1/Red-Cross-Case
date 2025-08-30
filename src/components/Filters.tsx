import { useQueryState } from '../hooks/useQueryState';
import { z } from 'zod';
import { useState, useEffect } from 'react';

const schema = {
  q: z.string().optional(),
  platform: z.enum(['mastodon']).optional(),
  lang: z.string().optional(),
  sort: z.enum(['newest', 'most_rt']).optional(),
  local: z.union([z.literal('true'), z.literal('false')]).optional(),
  tag: z.array(z.string()).optional(),
};

const DEFAULT_TAGS = [
  ''
];
const DEFAULT_LANGS = ['en'];
const DEFAULT_SCOPE = 'true';

export function Filters() {
  const { values, setQuery } = useQueryState(schema, { arrayKeys: ['tag'] });
  const current = values as Partial<{
    q: string; platform: string; lang: string; sort: string; local: string; tag: string[]
  }>;

  const [q, setQ] = useState<string>(current.q ?? '');
  const [tags, setTags] = useState<string[]>(current.tag ?? DEFAULT_TAGS);
  const [tagsInput] = useState<string>((current.tag ?? DEFAULT_TAGS).join(', '));
  const [lang, setLang] = useState<string>(current.lang ?? DEFAULT_LANGS[0]);
  const [local] = useState<string>(current.local ?? DEFAULT_SCOPE);

  useEffect(() => {
    if ((current.tag && current.tag.length) || current.lang || current.local || current.q) return;
    setQuery({
      local: local,
      ...(lang ? { lang } : {}),
      ...(q ? { q } : {}),
      tag: tags
    });
  }, []);

  useEffect(() => {
    const cleanTags = tagsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    setTags(cleanTags);

    setQuery({
      local,
      ...(lang ? { lang } : { lang: undefined }),
      ...(q ? { q } : { q: undefined }),
      tag: cleanTags.length ? cleanTags : undefined, 
    });
  }, [q, tagsInput, lang, local, setQuery]);

  return (
    <div className="sticky top-14 z-10 border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-black/40">
      <div className="container-app flex flex-wrap items-center gap-2 py-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"><path fill="currentColor" d="M12.9 14.32a8 8 0 1 1 1.414-1.414l3.387 3.386-1.414 1.415-3.387-3.387Zm-4.9.68a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/></svg>
          <input
            aria-label="Search"
            type="search"
            placeholder="Search posts or #hashtags"
            className="quiet-input w-full pl-9"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
          />
        </div>

        <select
          aria-label="Language"
          className="quiet-input px-3"
          value={lang}
          onChange={(e) => setLang(e.currentTarget.value)}
        >
          <option value="">Any language</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );
}

export default Filters;