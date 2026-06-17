import { useState, useRef, useCallback, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Image,
  Sparkles,
  Download,
  X,
  Maximize2,
  Clock,
  Trash2,
  AlertCircle,
  Key,
  Zap,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image as UIImage } from '@/components/ui/image';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { generateImage, type IImageResult } from '@/api/agnes';
import TokenSettingsPanel from '@/components/TokenSettingsPanel';
import { useAgnesToken } from '@/hooks/useAgnesToken';
import { useAssets } from '@/hooks/useAssets';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLACEHOLDER_PROMPTS = [
  '一只在霓虹灯城市中漫步的机械猫，赛博朋克风格',
  '宁静的日式禅意庭院，樱花飘落，清晨薄雾',
  '未来太空站内部，全息投影屏幕，科幻电影质感',
  '水晶洞穴中的独角兽，魔法光点环绕，梦幻插画风格',
];

const SIZE_OPTIONS = [
  { label: '1:1 (1024×1024)', value: '1024x1024' },
  { label: '16:9 (1792×1024)', value: '1792x1024' },
  { label: '9:16 (1024×1792)', value: '1024x1792' },
  { label: '4:3 (1152×896)', value: '1152x896' },
  { label: '3:4 (896×1152)', value: '896x1152' },
];

const QUALITY_OPTIONS = [
  { label: '标准', value: 'standard' },
  { label: '高清', value: 'hd' },
];

interface IImageGenParams {
  size: '1024x1024' | '1792x1024' | '1024x1792' | '1152x896' | '896x1152';
  n: number;
  quality: 'standard' | 'hd';
  seed: number | null;
  guidanceScale: number;
}

const DEFAULT_PARAMS: IImageGenParams = {
  size: '1024x1024',
  n: 1,
  quality: 'standard',
  seed: null,
  guidanceScale: 7.5,
};

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
// History Item
// ---------------------------------------------------------------------------

function HistoryItem({
  record,
  isActive,
  onSelect,
  onDelete,
}: {
  record: IImageResult;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      onClick={onSelect}
      className={`group relative w-full flex items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${
        isActive
          ? 'bg-primary/10 border border-primary/30'
          : 'border border-transparent hover:bg-muted/50'
      }`}
    >
      <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
        <UIImage src={record.url} alt={record.prompt} className="size-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{record.prompt}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {new Date(record.timestamp).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="!absolute right-1 top-1/2 -translate-y-1/2 z-20 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        aria-label="删除记录"
      >
        <X className="size-3.5" />
      </Button>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Advanced Params Panel
// ---------------------------------------------------------------------------

function AdvancedParamsPanel({
  params,
  onChange,
}: {
  params: IImageGenParams;
  onChange: (p: IImageGenParams) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const update = (patch: Partial<IImageGenParams>) => onChange({ ...params, ...patch });

  return (
    <div className="border-t border-border/20 pt-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <SlidersHorizontal className="size-3.5" />
        高级设置
        {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {/* 尺寸选择 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">尺寸</Label>
                <Select value={params.size} onValueChange={(v) => update({ size: v as IImageGenParams['size'] })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 生成数量 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">生成数量</Label>
                <Select
                  value={String(params.n)}
                  onValueChange={(v) => update({ n: Number(v) })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4].map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-xs">
                        {n} 张
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 质量档位 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">质量档位</Label>
                <Select value={params.quality} onValueChange={(v) => update({ quality: v as IImageGenParams['quality'] })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 随机种子 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">随机种子</Label>
                <Input
                  type="number"
                  value={params.seed}
                  onChange={(e) => update({ seed: e.target.value ? Number(e.target.value) : null })}
                  placeholder="留空则随机"
                  className="h-9 text-xs"
                />
              </div>

              {/* 引导系数 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">引导系数</Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {params.guidanceScale.toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[params.guidanceScale]}
                  onValueChange={([v]) => update({ guidanceScale: v })}
                  min={3}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground/60">
                  <span>3</span>
                  <span>20</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generating Overlay (full-area mask with progress)
// ---------------------------------------------------------------------------

function GeneratingOverlay({ onCancel }: { onCancel: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* 骨架屏占位 */}
      <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Skeleton className="w-full h-[400px] rounded-none" />
          <div className="px-5 py-4 space-y-3 border-t border-border/20">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>

      {/* 半透明遮罩 + 居中加载动画 */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm rounded-xl">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-4"
        >
          {/* 旋转 spinner */}
          <div className="relative">
            <div className="size-16 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 animate-pulse" />
            <Loader2 className="!absolute inset-0 m-auto size-7 text-accent animate-spin" />
          </div>

          <div className="text-center space-y-1.5">
            <p className="text-sm font-medium text-foreground">正在生成图片</p>
            <p className="text-xs text-muted-foreground">请稍候，这通常需要 5-15 秒...</p>
          </div>

          {/* 取消按钮 */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={onCancel}
          >
            <X className="size-3.5" />
            取消生成
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState<IImageResult[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [params, setParams] = useState<IImageGenParams>(DEFAULT_PARAMS);
  const abortRef = useRef<AbortController | null>(null);

  const { hasToken: tokenConfigured } = useAgnesToken();
  const { addAsset } = useAssets();
  const activeRecord = history.find((r) => r.id === activeId) ?? null;

  // 从 URL 参数回填 prompt（资产管理页"重新生成"跳转）
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const promptParam = searchParams.get('prompt');
    if (promptParam) {
      setPrompt(promptParam);
      const paramsParam = searchParams.get('params');
      if (paramsParam) {
        try {
          const parsed = JSON.parse(paramsParam);
          setParams((prev) => ({ ...prev, ...parsed }));
        } catch {
          // ignore parse error
        }
      }
      // 清除 URL 参数避免重复触发
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ---- Handlers ----

  const handleGenerate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = prompt.trim();
      if (!trimmed) {
        toast.error('请输入图片描述');
        return;
      }
      if (!tokenConfigured) {
        toast.error('请先配置 API Token');
        setSettingsOpen(true);
        return;
      }

      setGenerating(true);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await generateImage(trimmed, controller.signal, params);
        setHistory((prev) => [result, ...prev]);
        setActiveId(result.id);
        setPrompt('');
        // 资产入库
        addAsset({
          id: result.id,
          type: 'image',
          prompt: result.prompt,
          url: result.url,
          timestamp: result.timestamp,
        });
        toast.success('图片生成成功');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          toast.info('已取消生成');
          return;
        }
        const msg = err instanceof Error ? err.message : '图像生成失败，请检查 Token 和网络连接';
        toast.error(msg);
      } finally {
        setGenerating(false);
        abortRef.current = null;
      }
    },
    [prompt, tokenConfigured, params, addAsset],
  );

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleDownload = useCallback(
    async (url: string, id: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `agnes-image-${id}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
        toast.success('下载已开始');
      } catch {
        toast.error('下载失败，请重试');
      }
    },
    [],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setHistory((prev) => prev.filter((r) => r.id !== id));
      if (activeId === id) {
        setActiveId(null);
      }
    },
    [activeId],
  );

  const handleClearAll = useCallback(() => {
    setHistory([]);
    setActiveId(null);
    toast.success('已清空生成历史');
  }, []);

  // ---- Render ----

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-[calc(100vh-0px)]">
        {/* ---- Left: History Panel ---- */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border/30 bg-card/40 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border/20">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">生成历史</span>
              {history.length > 0 && (
                <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                  {history.length}
                </Badge>
              )}
            </div>
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-destructive"
                onClick={handleClearAll}
              >
                <Trash2 className="size-3 mr-1" />
                清空
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
                <Image className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">暂无生成历史</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  输入提示词开始生成图片
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {history.map((record) => (
                  <HistoryItem
                    key={record.id}
                    record={record}
                    isActive={activeId === record.id}
                    onSelect={() => setActiveId(record.id)}
                    onDelete={() => handleDelete(record.id)}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </aside>

        {/* ---- Right: Main Content ---- */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="shrink-0 flex items-center justify-between px-4 lg:px-8 py-4 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
                <Image className="size-5 text-accent" />
              </div>
              <div>
                <h1 className="text-base font-semibold">图像生成</h1>
                <p className="text-xs text-muted-foreground">agnes-image-2.1-flash</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!tokenConfigured && (
                <Badge variant="outline" className="border-destructive/30 text-destructive text-xs">
                  <AlertCircle className="size-3 mr-1" />
                  未配置 Token
                </Badge>
              )}
              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                    <Key className="size-3.5" />
                    API 设置
                  </Button>
                </SheetTrigger>
                <TokenSettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
              </Sheet>
            </div>
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 space-y-8">
              {/* ---- Input Form ---- */}
              <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardContent className="p-5">
                  <form onSubmit={handleGenerate} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-accent" />
                      <label htmlFor="image-prompt" className="text-sm font-medium">
                        描述你想要生成的图片
                      </label>
                    </div>

                    <div className="relative">
                      <Input
                        id="image-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="例如：一只在霓虹灯城市中漫步的机械猫，赛博朋克风格"
                        disabled={generating}
                        className="h-12 pr-24 text-sm bg-muted/30"
                        autoComplete="off"
                      />
                      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        {generating ? (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-9 gap-1.5"
                            onClick={handleCancel}
                          >
                            <X className="size-3.5" />
                            取消
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            size="sm"
                            className="h-9 gap-1.5"
                            disabled={!prompt.trim() || !tokenConfigured}
                          >
                            <Zap className="size-3.5" />
                            生成
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Placeholder prompts */}
                    <div className="flex flex-wrap gap-2">
                      {PLACEHOLDER_PROMPTS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPrompt(p)}
                          disabled={generating}
                          className="text-xs px-3 py-1.5 rounded-full border border-border/40 bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed truncate max-w-[260px]"
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {/* Advanced params */}
                    <AdvancedParamsPanel params={params} onChange={setParams} />
                  </form>
                </CardContent>
              </Card>

              {/* ---- Generating State (overlay + skeleton) ---- */}
              <AnimatePresence mode="wait">
                {generating && (
                  <GeneratingOverlay key="generating" onCancel={handleCancel} />
                )}
              </AnimatePresence>

              {/* ---- Result Display ---- */}
              <AnimatePresence mode="wait">
                {!generating && activeRecord && (
                  <motion.div
                    key={activeRecord.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Card className="border-border/30 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        {/* Image */}
                        <div className="relative group bg-muted/20">
                          <UIImage
                            src={activeRecord.url}
                            alt={activeRecord.prompt}
                            className="w-full max-h-[500px] object-contain"
                          />
                          {/* Desktop hover actions */}
                          <div className="absolute top-3 right-3 hidden lg:flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-lg shadow-md"
                              onClick={() => setLightboxSrc(activeRecord.url)}
                              aria-label="放大预览"
                            >
                              <Maximize2 className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-lg shadow-md"
                              onClick={() => handleDownload(activeRecord.url, activeRecord.id)}
                              aria-label="下载图片"
                            >
                              <Download className="size-4" />
                            </Button>
                          </div>
                          {/* Mobile always-visible actions */}
                          <div className="absolute top-3 right-3 flex lg:hidden items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-lg shadow-md"
                              onClick={() => setLightboxSrc(activeRecord.url)}
                              aria-label="放大预览"
                            >
                              <Maximize2 className="size-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8 rounded-lg shadow-md"
                              onClick={() => handleDownload(activeRecord.url, activeRecord.id)}
                              aria-label="下载图片"
                            >
                              <Download className="size-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Prompt info */}
                        <div className="px-5 py-4 border-t border-border/20">
                          <p className="text-sm font-medium">提示词</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activeRecord.prompt}
                          </p>
                          {activeRecord.revisedPrompt && (
                            <>
                              <p className="text-xs font-medium text-muted-foreground mt-3">
                                模型优化后
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-0.5">
                                {activeRecord.revisedPrompt}
                              </p>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---- Empty State (no history, not generating) ---- */}
              {!generating && !activeRecord && history.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/10 to-primary/10 mb-5">
                    <Image className="size-10 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-base font-medium text-muted-foreground">
                    开始创作
                  </h3>
                  <p className="text-sm text-muted-foreground/60 mt-1.5 max-w-sm">
                     在上方输入图片描述，agnes-image-2.1-flash 将为你生成高质量图片
                  </p>
                  {!tokenConfigured && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-5 gap-1.5"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Key className="size-3.5" />
                      配置 API Token
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Lightbox ---- */}
      <AnimatePresence>
        {lightboxSrc && (
          <Lightbox
            src={lightboxSrc}
            alt="图片预览"
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
