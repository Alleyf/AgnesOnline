import { useState, useEffect, useCallback, useMemo } from 'react';
import { scopedStorage } from '@lark-apaas/client-toolkit-lite';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IAssetItem {
  id: string;
  type: 'image' | 'video';
  prompt: string;
  url: string;
  timestamp: number;
  /** 图片/视频的生成参数（可选） */
  params?: Record<string, unknown>;
}

export type AssetFilter = 'all' | 'image' | 'video';

export interface IAssetQuery {
  filter: AssetFilter;
  keyword: string;
  sortBy: 'newest' | 'oldest';
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = '__agnes_demo_assets';

function loadAll(): IAssetItem[] {
  try {
    const raw = scopedStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as IAssetItem[];
  } catch {
    return [];
  }
}

function saveAll(items: IAssetItem[]): void {
  try {
    scopedStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silently fail
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAssets() {
  const [items, setItems] = useState<IAssetItem[]>(loadAll);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 跨页面同步：监听自定义事件 + focus
  useEffect(() => {
    const handler = () => setItems(loadAll());
    window.addEventListener('agnes-assets-changed', handler);
    window.addEventListener('focus', handler);
    return () => {
      window.removeEventListener('agnes-assets-changed', handler);
      window.removeEventListener('focus', handler);
    };
  }, []);

  // 持久化 + 广播
  const persist = useCallback((next: IAssetItem[]) => {
    setItems(next);
    saveAll(next);
    window.dispatchEvent(new Event('agnes-assets-changed'));
  }, []);

  // ---- CRUD ----

  const addAsset = useCallback(
    (asset: IAssetItem) => {
      setItems((prev) => {
        const next = [asset, ...prev];
        saveAll(next);
        window.dispatchEvent(new Event('agnes-assets-changed'));
        return next;
      });
    },
    [],
  );

  const removeAsset = useCallback(
    (id: string) => {
      setItems((prev) => {
        const next = prev.filter((a) => a.id !== id);
        saveAll(next);
        window.dispatchEvent(new Event('agnes-assets-changed'));
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [],
  );

  const removeAssets = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setItems((prev) => {
        const next = prev.filter((a) => !idSet.has(a.id));
        saveAll(next);
        window.dispatchEvent(new Event('agnes-assets-changed'));
        return next;
      });
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    },
    [],
  );

  const clearAll = useCallback(() => {
    persist([]);
    setSelectedIds(new Set());
  }, [persist]);

  // ---- Selection ----

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // ---- Query ----

  const query = useCallback(
    (q: IAssetQuery) => {
      let filtered = items;

      // 类型筛选
      if (q.filter !== 'all') {
        filtered = filtered.filter((a) => a.type === q.filter);
      }

      // 关键词搜索
      if (q.keyword.trim()) {
        const kw = q.keyword.trim().toLowerCase();
        filtered = filtered.filter((a) => a.prompt.toLowerCase().includes(kw));
      }

      // 排序
      if (q.sortBy === 'oldest') {
        filtered = [...filtered].sort((a, b) => a.timestamp - b.timestamp);
      } else {
        filtered = [...filtered].sort((a, b) => b.timestamp - a.timestamp);
      }

      const total = filtered.length;
      const totalPages = Math.max(1, Math.ceil(total / q.pageSize));
      const start = (q.page - 1) * q.pageSize;
      const paged = filtered.slice(start, start + q.pageSize);

      return { items: paged, total, totalPages };
    },
    [items],
  );

  // ---- Stats ----

  const stats = useMemo(() => {
    const imageCount = items.filter((a) => a.type === 'image').length;
    const videoCount = items.filter((a) => a.type === 'video').length;
    return { total: items.length, imageCount, videoCount };
  }, [items]);

  return {
    items,
    stats,
    selectedIds,
    addAsset,
    removeAsset,
    removeAssets,
    clearAll,
    toggleSelect,
    selectAll,
    clearSelection,
    query,
  };
}
