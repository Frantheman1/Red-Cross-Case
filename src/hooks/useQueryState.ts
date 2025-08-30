import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { z } from 'zod';

type SchemaShape = Record<string, z.ZodTypeAny>;

interface UseQueryStateOptions {
  arrayKeys?: string[];
}

export function useQueryState<TSchema extends SchemaShape>(schema: TSchema, options: UseQueryStateOptions = {}) {
  const { arrayKeys = [] } = options;
  const subscribe = useCallback((onStoreChange: () => void) => {
    const handler = () => onStoreChange();
    window.addEventListener('popstate', handler);
    window.addEventListener('querychange', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('querychange', handler);
    };
  }, []);
  const search = useSyncExternalStore(subscribe, () => window.location.search);

  const parsed = useMemo(() => {
    const sp = new URLSearchParams(search);
    const base: Record<string, unknown> = {};
    for (const key of arrayKeys) {
      const values = sp.getAll(key);
      if (values.length > 0) base[key] = values;
    }
    for (const [k, v] of sp.entries()) {
      if (arrayKeys.includes(k)) continue;
      base[k] = v;
    }
    const shape = z.object(schema);
    const result = shape.safeParse(base);
    if (result.success) return result.data as z.infer<typeof shape>;
    return {} as z.infer<typeof shape>;
  }, [schema, arrayKeys, search]);

  const setQuery = useCallback((next: Partial<Record<keyof TSchema, unknown>> | URLSearchParams | Array<[string, string]>) => {
    const url = new URL(window.location.href);
    const applyKV = (key: string, value: unknown) => {
      if (value === undefined || value === null || value === '') {
        url.searchParams.delete(key);
      } else if (Array.isArray(value)) {
        url.searchParams.delete(key);
        for (const entry of value) url.searchParams.append(key, String(entry));
      } else if (typeof value === 'boolean') {
        url.searchParams.set(key, value ? 'true' : 'false');
      } else {
        url.searchParams.set(key, String(value));
      }
    };

    if (next instanceof URLSearchParams) {
      for (const key of new Set(Array.from(next.keys()))) {
        const vals = next.getAll(key);
        applyKV(key, vals.length > 1 ? vals : vals[0] ?? '');
      }
    } else if (Array.isArray(next)) {
      for (const [k, v] of next) applyKV(k, v);
    } else {
      for (const [k, v] of Object.entries(next)) applyKV(k, v);
    }

    window.history.replaceState({}, '', url.toString());
    window.dispatchEvent(new Event('querychange'));
  }, []);

  return { values: parsed, setQuery } as const;
}


