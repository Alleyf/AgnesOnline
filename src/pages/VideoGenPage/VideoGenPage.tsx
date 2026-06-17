import { useState, useCallback, useRef, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { logger, scopedStorage } from '@lark-apaas/client-toolkit-lite';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Video,
  Send,
  Download,
  Loader2,
  X,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Film,
  ChevronDown,
  Settings2,
  Play,
  Trash2,
} from 'lucide-react';
import { generateVideo, type IVideoResult } from '@/api/agnes';
import TokenSettingsPanel from '@/components/TokenSettingsPanel';
import { useAgnesToken } from '@/hooks/useAgnesToken';
import { useAssets, type IAssetItem } from '@/hooks/useAssets';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoGenParams {
  resolution: '480p' | '720p' | '1080p';
  duration: 5 | 10 | 16;
  motionStrength: number;
  fps: 24 | 30;
  seed: string;
}

const DEFAULT_PARAMS: VideoGenParams = {
  resolution: '720p',
  duration: 5,
  motionStrength: 50,
  fps: 24,
  seed: '',
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = '__agnes_demo_video_history';

function loadHistory(): IVideoResult[] {
  try {
    const raw = scopedStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as IVideoResult[]) : [];
  } catch {
    return [];
  }
}

function saveHistory(records: IVideoResult[]): void {
  try {
    scopedStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    logger.error('Failed to save video history:', String(e));
  }
}

function videoResultToAsset(r: IVideoResult): IAssetItem {
  return {
    id: r.id,
    type: 'video',
    prompt: r.prompt,
    url: r.url,
    timestamp: r.timestamp,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function EmptyState({ onOpenSettings, tokenReady }: { onOpenSettings: () => void; tokenReady: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-6">
        <Film className="size-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        开始生成视频
      </h3>
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
        {tokenReady
          ? '输入文本描述，agnes-video-v2.0 将为你生成电影级视频'
          : '请先配置 API Token 以使用视频生成功能'}
      </p>
      {!tokenReady && (
        <Button variant="outline" className="mt-4" onClick={onOpenSettings}>
          配置 API Token
          <ChevronRight className="size-4 ml-1" />
        </Button>
      )}
    </motion.div>
  );
}

function GeneratingOverlay({
  progress,
  status,
  onCancel,
}: {
  progress: number;
  status: string;
  onCancel: () => void;
}) {
  const statusLabel = status === 'queued' ? '排队中...' : status === 'processing' ? '生成中...' : '处理中...';
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-0">
          <div className="relative">
            <Skeleton className="w-full aspect-video rounded-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-sm gap-4">
              <div className="relative">
                <div className="size-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="size-7 text-primary animate-spin" />
                </div>
              </div>
              <p className="text-sm font-medium text-foreground">{statusLabel}</p>
              <div className="w-48 space-y-1.5">
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                    style={{ width: `${Math.max(progress, 2)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">{progress}%</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="size-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <Button variant="outline" size="sm" onClick={onCancel} className="mt-2">
                <X className="size-3.5 mr-1" />
                取消生成
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function VideoPlayerCard({
  record,
  onDownload,
}: {
  record: IVideoResult;
  onDownload: (record: IVideoResult) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
                <Play className="size-4 text-accent" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  生成结果
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  <Clock className="size-3" />
                  {new Date(record.timestamp).toLocaleString('zh-CN')}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => onDownload(record)}
            >
              <Download className="size-3.5 mr-1" />
              下载
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative bg-black">
            <video
              src={record.url}
              controls
              className="w-full aspect-video"
              poster=""
              preload="metadata"
            >
              你的浏览器不支持视频播放
            </video>
          </div>
          <div className="px-6 py-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              <span className="font-medium text-foreground/70">提示词：</span>
              {record.prompt}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function HistoryList({
  records,
  activeId,
  onSelect,
  onDownload,
  onClear,
}: {
  records: IVideoResult[];
  activeId: string | null;
  onSelect: (record: IVideoResult) => void;
  onDownload: (record: IVideoResult) => void;
  onClear: () => void;
}) {
  if (records.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
          <Clock className="size-3.5" />
          生成历史
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
            {records.length}
          </Badge>
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-destructive"
          onClick={onClear}
        >
          <Trash2 className="size-3 mr-1" />
          清空
        </Button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {records.map((record, i) => (
            <motion.button
              key={record.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              onClick={() => onSelect(record)}
              className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-200 text-left ${
                activeId === record.id
                  ? 'border-primary shadow-[0_0_12px_var(--primary)]'
                  : 'border-border/30 hover:border-border/60'
              }`}
            >
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                <Play className="size-8 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <span className="text-[10px] text-white/80 truncate w-full">
                    {record.prompt.slice(0, 30)}...
                  </span>
                </div>
              </div>
              <div className="p-2">
                <p className="text-[11px] text-muted-foreground truncate">
                  {new Date(record.timestamp).toLocaleString('zh-CN', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AdvancedParamsPanel({
  params,
  onChange,
}: {
  params: VideoGenParams;
  onChange: (p: VideoGenParams) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
          <Settings2 className="size-3.5" />
          高级设置
          <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-border/30 bg-muted/20">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">分辨率</Label>
            <Select
              value={params.resolution}
              onValueChange={(v) => onChange({ ...params, resolution: v as VideoGenParams['resolution'] })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="480p">480p (标清)</SelectItem>
                <SelectItem value="720p">720p (高清)</SelectItem>
                <SelectItem value="1080p">1080p (全高清)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">时长</Label>
            <Select
              value={String(params.duration)}
              onValueChange={(v) => onChange({ ...params, duration: Number(v) as VideoGenParams['duration'] })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 秒</SelectItem>
                <SelectItem value="10">10 秒</SelectItem>
                <SelectItem value="16">16 秒</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">帧率</Label>
            <Select
              value={String(params.fps)}
              onValueChange={(v) => onChange({ ...params, fps: Number(v) as VideoGenParams['fps'] })}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 fps</SelectItem>
                <SelectItem value="30">30 fps</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">随机种子</Label>
            <Input
              type="number"
              value={params.seed}
              onChange={(e) => onChange({ ...params, seed: e.target.value })}
              placeholder="留空则随机"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">运动强度</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {params.motionStrength <= 33 ? '低' : params.motionStrength <= 66 ? '中' : '高'}
              </span>
            </div>
            <Slider
              value={[params.motionStrength]}
              onValueChange={([v]) => onChange({ ...params, motionStrength: v })}
              min={10}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function VideoGenPage() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoStatus, setVideoStatus] = useState('');
  const [currentRecord, setCurrentRecord] = useState<IVideoResult | null>(null);
  const [history, setHistory] = useState<IVideoResult[]>(loadHistory);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [params, setParams] = useState<VideoGenParams>(DEFAULT_PARAMS);
  const abortRef = useRef<AbortController | null>(null);

  const { hasToken: tokenReady } = useAgnesToken();
  const { addAsset } = useAssets();

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
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
    setGenerating(false);
    toast.info('已取消生成');
  }, []);

  const handleGenerate = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = prompt.trim();
      if (!trimmed) {
        toast.error('请输入视频描述文本');
        return;
      }
      if (!tokenReady) {
        toast.error('请先配置 API Token');
        setSettingsOpen(true);
        return;
      }

      setGenerating(true);
      setVideoProgress(0);
      setVideoStatus('queued');

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const result = await generateVideo(trimmed, controller.signal, undefined, (progress, status) => {
          setVideoProgress(progress);
          setVideoStatus(status);
        });
        setCurrentRecord(result);
        setHistory((prev) => {
          const updated = [result, ...prev];
          saveHistory(updated);
          return updated;
        });
        addAsset(videoResultToAsset(result));
        toast.success('视频生成成功');
        setPrompt('');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const msg = err instanceof Error ? err.message : '视频生成失败';
        logger.error('Video generation failed:', String(err));
        toast.error(msg);
      } finally {
        setGenerating(false);
        abortRef.current = null;
      }
    },
    [prompt, tokenReady, addAsset],
  );

  const handleDownload = useCallback(async (record: IVideoResult) => {
    try {
      toast.info('正在准备下载...');
      const response = await fetch(record.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `agnes-video-${record.timestamp}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success('下载已开始');
    } catch {
      window.open(record.url, '_blank', 'noopener');
      toast.info('已在新标签页打开视频');
    }
  }, []);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    setCurrentRecord(null);
    saveHistory([]);
    toast.success('历史记录已清空');
  }, []);

  const handleSelectHistory = useCallback((record: IVideoResult) => {
    setCurrentRecord(record);
  }, []);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-primary/20">
            <Video className="size-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">视频生成</h1>
            <p className="text-sm text-muted-foreground">
              agnes-video-v2.0 · 电影级视频生成
            </p>
          </div>
        </motion.div>

        {/* Input form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Film className="size-4 text-primary" />
                视频描述
              </CardTitle>
              <CardDescription>
                描述你想要的视频内容，AI 将为你生成
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    tokenReady
                      ? '例如：一只金毛犬在阳光下的海滩奔跑，慢动作，电影质感...'
                      : '请先配置 API Token'
                  }
                  disabled={!tokenReady || generating}
                  rows={4}
                  className="resize-none bg-muted/30 border-border/40 text-sm placeholder:text-muted-foreground/50"
                />

                <AdvancedParamsPanel params={params} onChange={setParams} />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {prompt.length > 0
                      ? `${prompt.length} 个字符`
                      : '支持中英文描述'}
                  </p>
                  <div className="flex items-center gap-2">
                    {generating && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelGeneration}
                      >
                        取消
                      </Button>
                    )}
                    <Button
                      type="submit"
                      disabled={!tokenReady || generating || !prompt.trim()}
                      className="gap-1.5"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Send className="size-4" />
                          生成视频
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Result area */}
        <AnimatePresence mode="wait">
          {generating ? (
            <GeneratingOverlay
              key="generating"
              progress={videoProgress}
              status={videoStatus}
              onCancel={cancelGeneration}
            />
          ) : currentRecord ? (
            <VideoPlayerCard
              key={currentRecord.id}
              record={currentRecord}
              onDownload={handleDownload}
            />
          ) : null}
        </AnimatePresence>

        {/* History */}
        <HistoryList
          records={history}
          activeId={currentRecord?.id ?? null}
          onSelect={handleSelectHistory}
          onDownload={handleDownload}
          onClear={handleClearHistory}
        />

        {/* Empty state */}
        {!generating && !currentRecord && history.length === 0 && (
          <EmptyState onOpenSettings={() => setSettingsOpen(true)} tokenReady={tokenReady} />
        )}
      </main>
    </div>
  );
}
