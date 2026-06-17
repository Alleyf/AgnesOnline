import { useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Image,
  Video,
  Download,
  Trash2,
  X,
  Search,
  Maximize2,
  Play,
  Clock,
  CheckSquare,
  Square,
  FolderOpen,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Image as UIImage } from '@/components/ui/image';
import { useAssets, type IAssetItem } from '@/hooks/useAssets';
import { useAgnesToken } from '@/hooks/useAgnesToken';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SORT_OPTIONS = [
  { value: 'newest', label: '最新优先' },
  { value: 'oldest', label: '最早优先' },
  { value: 'name', label: '名称排序' },
] as const;

// ---------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <UIImage
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl"
        />
        <Button
          size="icon"
          variant="secondary"
          className="!absolute -right-3 -top-3 z-20 h-9 w-9 rounded-full shadow-lg"
          onClick={onClose}
          aria-label="关闭预览"
        >
          <X className="size-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Asset Card
// ---------------------------------------------------------------------------

function AssetCard({
  asset,
  selected,
  onToggleSelect,
  onPreview,
  onDownload,
  onDelete,
  onRegenerate,
}: {
  asset: IAssetItem;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (asset: IAssetItem) => void;
  onDownload: (asset: IAssetItem) => void;
  onDelete: (id: string) => void;
  onRegenerate: (asset: IAssetItem) => void;
}) {
  const isImage = asset.type === 'image';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <Card
        className={`overflow-hidden border transition-all duration-200 cursor-pointer h-full flex flex-col ${
          selected
            ? 'border-primary ring-2 ring-primary/30'
            : 'border-border/40 hover:border-border/60'
        }`}
        onClick={() => onPreview(asset)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          {isImage ? (
            <UIImage
              src={asset.url}
              alt={asset.prompt}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="size-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Play className="size-10 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
            <div className="flex items-center gap-1.5">
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(asset);
                }}
                aria-label="下载"
              >
                <Download className="size-3.5" />
              </Button>
              {isImage && (
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(asset);
                  }}
                  aria-label="放大预览"
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              )}
              <Button
                size="icon"
                variant="secondary"
                className="h-7 w-7 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(asset);
                }}
                aria-label="重新生成"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full hover:bg-destructive hover:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.id);
              }}
              aria-label="删除"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>

          {/* Type badge */}
          <Badge
            variant="secondary"
            className="!absolute left-2 top-2 z-20 text-[10px] px-1.5 py-0 h-5"
          >
            {isImage ? (
              <Image className="size-3 mr-1" />
            ) : (
              <Video className="size-3 mr-1" />
            )}
            {isImage ? '图片' : '视频'}
          </Badge>

          {/* Select checkbox */}
          <button
            className={`absolute right-2 top-2 z-20 size-6 rounded-md flex items-center justify-center transition-all ${
              selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/70 text-foreground/50 opacity-0 group-hover:opacity-100 hover:bg-background/90'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(asset.id);
            }}
            aria-label={selected ? '取消选择' : '选择'}
          >
            {selected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
          </button>
        </div>

        {/* Info */}
        <CardContent className="p-3 space-y-1.5 flex-1 flex flex-col">
          <p className="text-xs leading-relaxed line-clamp-2 text-foreground/80 flex-1">
            {asset.prompt}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              {new Date(asset.timestamp).toLocaleString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {asset.params?.size && (
              <span className="text-[10px] text-muted-foreground/60">{String(asset.params.size)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState({ filterActive }: { filterActive: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50 mb-4">
        <FolderOpen className="size-8 text-muted-foreground/40" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">
        {filterActive ? '没有匹配的资产' : '暂无资产'}
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        {filterActive
          ? '尝试调整筛选条件或搜索关键词'
          : '在图像生成或视频生成页面创建内容后，资产将自动出现在这里'}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AssetsPage() {
  const { items: assets = [], removeAsset: deleteAsset, removeAssets: deleteAssets, clearAll } = useAssets();
  const { hasToken } = useAgnesToken();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lightboxAsset, setLightboxAsset] = useState<IAssetItem | null>(null);

  // ---- Derived ----

  const filtered = useMemo(() => {
    let list = [...assets];

    // Tab filter
    if (activeTab === 'image') {
      list = list.filter((a) => a.type === 'image');
    } else if (activeTab === 'video') {
      list = list.filter((a) => a.type === 'video');
    }

    // Search
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      list = list.filter((a) => a.prompt.toLowerCase().includes(kw));
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        list.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'name':
        list.sort((a, b) => a.prompt.localeCompare(b.prompt, 'zh-CN'));
        break;
      default: // newest
        list.sort((a, b) => b.timestamp - a.timestamp);
    }

    return list;
  }, [assets, activeTab, searchKeyword, sortBy]);

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length;

  // ---- Handlers ----

  const handleToggleSelect = useCallback((id: string) => {
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

  const handleToggleAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  }, [filtered, isAllSelected]);

  const handleBatchDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    deleteAssets([...selectedIds]);
    setSelectedIds(new Set());
    toast.success(`已删除 ${selectedIds.size} 个资产`);
  }, [selectedIds, deleteAssets]);

  const handleDelete = useCallback(
    (id: string) => {
      deleteAsset(id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('已删除');
    },
    [deleteAsset],
  );

  const handleDownload = useCallback(async (asset: IAssetItem) => {
    try {
      const response = await fetch(asset.url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      const ext = asset.type === 'image' ? 'png' : 'mp4';
      a.download = `agnes-${asset.type}-${asset.id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast.success('下载已开始');
    } catch {
      toast.error('下载失败，请重试');
    }
  }, []);

  const handlePreview = useCallback((asset: IAssetItem) => {
    if (asset.type === 'image') {
      setLightboxAsset(asset);
    } else {
      // For video, open in new tab
      window.open(asset.url, '_blank');
    }
  }, []);

  const handleRegenerate = useCallback(
    (asset: IAssetItem) => {
      const targetPath = asset.type === 'image' ? '/image-gen' : '/video-gen';
      const params = new URLSearchParams();
      params.set('prompt', asset.prompt);
      if (asset.params) {
        params.set('params', JSON.stringify(asset.params));
      }
      navigate(`${targetPath}?${params.toString()}`);
    },
    [],
  );

  const handleClearAll = useCallback(() => {
    if (assets.length === 0) return;
    clearAll();
    setSelectedIds(new Set());
    toast.success('已清空所有资产');
  }, [assets.length, clearAll]);

  const filterActive = activeTab !== 'all' || searchKeyword.trim().length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="shrink-0 border-b border-border/30 px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">📦 资产管理</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              管理所有生成的图片和视频资产
            </p>
          </div>
          <div className="flex items-center gap-2">
            {assets.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4 mr-1.5" />
                清空全部
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-border/20 px-4 md:px-6 lg:px-8 py-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="shrink-0">
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs px-3">
                全部
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 h-4">
                  {assets.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="image" className="text-xs px-3">
                <Image className="size-3 mr-1" />
                图片
              </TabsTrigger>
              <TabsTrigger value="video" className="text-xs px-3">
                <Video className="size-3 mr-1" />
                视频
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative flex-1 min-w-0 max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchKeyword}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchKeyword(e.target.value)}
              placeholder="搜索提示词..."
              className="h-9 pl-9 text-sm"
            />
          </div>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-9 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Batch actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                已选 {selectedIds.size} 项
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-destructive hover:bg-destructive/10"
                onClick={handleBatchDelete}
              >
                <Trash2 className="size-3 mr-1" />
                批量删除
              </Button>
            </div>
          )}

          {/* Select all */}
          {filtered.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs shrink-0"
              onClick={handleToggleAll}
            >
              {isAllSelected ? (
                <>
                  <CheckSquare className="size-3.5 mr-1" />
                  取消全选
                </>
              ) : (
                <>
                  <Square className="size-3.5 mr-1" />
                  全选
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 lg:px-8 py-6">
        {filtered.length === 0 ? (
          <EmptyState filterActive={filterActive} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  selected={selectedIds.has(asset.id)}
                  onToggleSelect={handleToggleSelect}
                  onPreview={handlePreview}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  onRegenerate={handleRegenerate}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxAsset && (
          <Lightbox
            src={lightboxAsset.url}
            alt={lightboxAsset.prompt}
            onClose={() => setLightboxAsset(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
