import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageSquare, Image, Video, Settings, Circle, Folder } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import { useAgnesToken } from '@/hooks/useAgnesToken';
import AgnesLogo from '@/components/AgnesLogo';

const BASE_URL = 'https://apihub.agnes-ai.com/v1';

const NAV_ITEMS = [
  { path: '/', label: '首页', icon: Home },
  { path: '/chat', label: '文本聊天', icon: MessageSquare },
  { path: '/image-gen', label: '图像生成', icon: Image },
  { path: '/video-gen', label: '视频生成', icon: Video },
  { path: '/assets', label: '资产管理', icon: Folder },
];

function SettingsPanel() {
  const { token, hasToken, setToken, clearToken } = useAgnesToken();
  const [inputValue, setInputValue] = useState(token);
  const [open, setOpen] = useState(false);

  const handleSave = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      toast.error('请输入 API Token');
      return;
    }
    setToken(trimmed);
    toast.success('Token 已保存');
    setOpen(false);
  }, [inputValue, setToken]);

  const handleClear = useCallback(() => {
    clearToken();
    setInputValue('');
    toast.success('Token 已清除');
  }, [clearToken]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          aria-label="API Token 设置"
        >
          <Settings className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-md border-border">
        <SheetHeader>
          <SheetTitle className="text-foreground">API Token 配置</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            输入你的 Agnes AI API Key 以使用所有功能
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          {/* Base URL */}
          <div className="space-y-2">
            <Label htmlFor="base-url" className="text-sm text-muted-foreground">
              基础 URL
            </Label>
            <Input
              id="base-url"
              value={BASE_URL}
              disabled
              className="cursor-not-allowed opacity-60"
            />
          </div>

          {/* Token */}
          <div className="space-y-2">
            <Label htmlFor="api-token" className="text-sm text-muted-foreground">
              API Token
            </Label>
            <Input
              id="api-token"
              type="password"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="sk-..."
              className="font-mono"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <Circle
              className={`size-2.5 ${hasToken ? 'fill-success text-success' : 'fill-destructive text-destructive'}`}
            />
            <span className={hasToken ? 'text-success' : 'text-destructive'}>
              {hasToken ? '已配置' : '未配置'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={!inputValue.trim()} className="flex-1">
              保存
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!hasToken}
              className="flex-1"
            >
              清除 Token
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AppSidebar() {
  const { pathname } = useLocation();
  const { state } = useSidebar();
  const { hasToken } = useAgnesToken();

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center">
          <div className="size-8 shrink-0 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <AgnesLogo size={28} />
          </div>
          <div className="flex-1 min-w-0 group-data-[state=collapsed]:hidden">
            <div className="text-sm font-semibold truncate text-sidebar-foreground">
              Agnes AI
            </div>
            <div className="text-[11px] text-sidebar-foreground/50 truncate">
              在线演示平台
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup className="p-2">
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.path === '/'
                  ? pathname === '/'
                  : pathname === item.path || pathname.startsWith(`${item.path}/`);

              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild tooltip={item.label} isActive={isActive}>
                    <NavLink
                      to={item.path}
                      end={item.path === '/'}
                      className="flex items-center gap-2"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="group-data-[state=collapsed]:hidden">
                        {item.label}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer: Token status + Settings */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3 group-data-[state=collapsed]:px-0 group-data-[state=collapsed]:justify-center">
          <div className="flex items-center gap-2 min-w-0 group-data-[state=collapsed]:hidden flex-1">
            <Circle
              className={`size-2 shrink-0 ${hasToken ? 'fill-success text-success' : 'fill-destructive text-destructive'}`}
            />
            <span className="text-xs text-sidebar-foreground/60 truncate">
              {hasToken ? 'Token 已配置' : 'Token 未配置'}
            </span>
          </div>
          <SettingsPanel />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
