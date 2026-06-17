import { useState, type FormEvent } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UniversalLink } from '@lark-apaas/client-toolkit-lite';
import { Settings, Key, Trash2, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useAgnesToken } from '@/hooks/useAgnesToken';

const BASE_URL = 'https://apihub.agnes-ai.com/v1';

interface TokenSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TokenSettingsPanel({ open, onOpenChange }: TokenSettingsPanelProps) {
  const { token: savedToken, hasToken, setToken, clearToken } = useAgnesToken();
  const [inputValue, setInputValue] = useState(savedToken);
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error('请输入 API Token');
      return;
    }
    setSaving(true);
    try {
      setToken(trimmed);
      toast.success('Token 已保存');
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    clearToken();
    setInputValue('');
    toast.success('Token 已清除');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BASE_URL);
      toast.success('已复制基础 URL');
    } catch {
      toast.error('复制失败');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md border-l border-border/40 bg-card/95 backdrop-blur-xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/30">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                <Settings className="size-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-lg font-semibold">API 设置</SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground">
                  配置 Agnes AI API Token
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* Token 状态 */}
            <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 p-4">
              <div
                className={`size-2.5 shrink-0 rounded-full ${
                  hasToken ? 'bg-success shadow-[0_0_8px_var(--success)]' : 'bg-destructive shadow-[0_0_8px_var(--destructive)]'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {hasToken ? 'Token 已配置' : 'Token 未配置'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {hasToken
                    ? `${savedToken.slice(0, 8)}...${savedToken.slice(-4)}`
                    : '请配置 API Token 以使用全部功能'}
                </p>
              </div>
              {hasToken && (
                <Badge variant="outline" className="shrink-0 border-success/30 text-success text-xs">
                  <Check className="size-3 mr-1" />
                  已激活
                </Badge>
              )}
            </div>

            {/* 基础 URL */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">基础 URL</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    value={BASE_URL}
                    readOnly
                    className="pr-9 font-mono text-sm bg-muted/50 cursor-default"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 h-10 w-10"
                  onClick={handleCopy}
                  aria-label="复制 URL"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Agnes AI API 兼容 OpenAI 接口格式
              </p>
            </div>

            {/* Token 输入 */}
            <form onSubmit={handleSave} className="space-y-3">
              <Label htmlFor="api-token" className="text-sm font-medium">
                API Token
              </Label>
              <div className="relative">
                <Input
                  id="api-token"
                  type={showToken ? 'text' : 'password'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入你的 Agnes AI API Key"
                  className="pr-20 font-mono text-sm"
                  autoComplete="off"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowToken(!showToken)}
                    aria-label={showToken ? '隐藏 Token' : '显示 Token'}
                  >
                    {showToken ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={saving || !inputValue.trim()}
                  className="flex-1"
                >
                  <Key className="size-4 mr-1.5" />
                  {saving ? '保存中...' : '保存 Token'}
                </Button>
                {hasToken && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClear}
                    className="shrink-0"
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    清除
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* 底部提示 */}
          <div className="px-6 py-4 border-t border-border/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Token 仅保存在本地浏览器中，不会上传到任何服务器。
              获取 API Key 请访问{' '}
              <UniversalLink
                to="https://apihub.agnes-ai.com"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Agnes AI API Hub
              </UniversalLink>
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
