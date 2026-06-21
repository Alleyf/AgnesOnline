import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { scopedStorage } from '@lark-apaas/client-toolkit-lite';
import {
  Send,
  Trash2,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Key,
  ArrowDown,
  Copy,
  RefreshCw,
  Pencil,
  Quote,
  Plus,
  MessageSquare,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { chatCompletion } from '@/api/agnes';
import TokenSettingsPanel from '@/components/TokenSettingsPanel';
import { useAgnesToken } from '@/hooks/useAgnesToken';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  quoteId?: string;
}

interface IChatSession {
  id: string;
  name: string;
  messages: IChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------------
// Session storage
// ---------------------------------------------------------------------------

const SESSIONS_KEY = '__agnes_demo_chat_sessions';
const ACTIVE_SESSION_KEY = '__agnes_demo_active_session';

function loadSessions(): IChatSession[] {
  try {
    const raw = scopedStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as IChatSession[];
  } catch {
    return [];
  }
}

function saveSessions(sessions: IChatSession[]): void {
  try {
    scopedStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // silently fail
  }
}

function loadActiveSessionId(): string | null {
  try {
    return scopedStorage.getItem(ACTIVE_SESSION_KEY) || null;
  } catch {
    return null;
  }
}

function saveActiveSessionId(id: string): void {
  try {
    scopedStorage.setItem(ACTIVE_SESSION_KEY, id);
  } catch {
    // silently fail
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function autoName(messages: IChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return '新对话';
  const text = firstUser.content.trim().slice(0, 15);
  return text.length < firstUser.content.trim().length ? `${text}...` : text;
}

// ---------------------------------------------------------------------------
// Markdown renderer
// ---------------------------------------------------------------------------

/** Markdown 渲染组件 — 使用 react-markdown + remark-gfm */
function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-xl font-bold mt-6 mb-3 text-foreground">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-semibold mt-5 mb-2 text-foreground">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground">{children}</h3>,
        p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        code: ({ className, children, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono text-accent" {...props}>{children}</code>;
          }
          return <code className={className} {...props}>{children}</code>;
        },
        pre: ({ children }) => {
          // 提取代码文本用于复制
          const codeEl = children as React.ReactElement<{ children?: React.ReactNode; className?: string }>;
          const codeText = extractTextFromChildren(codeEl?.props?.children);
          const langClass = codeEl?.props?.className || '';
          const lang = langClass.replace('language-', '');

          return (
            <div className="group/mycode relative my-3 rounded-lg bg-muted/80 overflow-hidden">
              {/* 顶部栏：语言标签 + 复制按钮 */}
              <div className="flex items-center justify-between px-4 py-1.5 bg-muted/60 border-b border-border/20 text-xs text-muted-foreground">
                <span>{lang || 'code'}</span>
                <button
                  type="button"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(codeText).then(
                      () => toast.success('已复制代码'),
                      () => toast.error('复制失败'),
                    );
                  }}
                >
                  <Copy className="size-3" />
                  复制
                </button>
              </div>
              <pre className="overflow-x-auto p-4 text-sm font-mono leading-relaxed">
                {children}
              </pre>
            </div>
          );
        },
        ul: ({ children }) => <ul className="ml-4 list-disc space-y-1 text-foreground/90 my-2">{children}</ul>,
        ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1 text-foreground/90 my-2">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-4 italic text-muted-foreground my-2">{children}</blockquote>,
        hr: () => <hr className="my-4 border-border/40" />,
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="w-full text-sm border-collapse border border-border/40">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
        th: ({ children }) => <th className="border border-border/40 px-3 py-2 text-left font-semibold">{children}</th>,
        td: ({ children }) => <td className="border border-border/40 px-3 py-2">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function extractTextFromChildren(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    const props = (children as { props?: { children?: React.ReactNode } }).props;
    return extractTextFromChildren(props?.children);
  }
  return '';
}

/**
 * 解析消息内容，分离引用块和正文。
 * 规则：消息开头的连续 `> ` 行为引用块，第一个非 `> ` 行之后的内容为正文。
 */
function parseQuotedContent(content: string): { quotedText: string | null; bodyText: string } {
  const lines = content.split('\n');
  let quoteEndIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('> ')) {
      quoteEndIndex = i + 1;
    } else {
      break;
    }
  }

  if (quoteEndIndex === 0) {
    return { quotedText: null, bodyText: content };
  }

  const quotedText = lines.slice(0, quoteEndIndex).map((l) => l.slice(2)).join('\n');
  const bodyText = lines.slice(quoteEndIndex).join('\n').trim();

  return { quotedText, bodyText };
}

// ---------------------------------------------------------------------------
// Message action toolbar
// ---------------------------------------------------------------------------

function MessageToolbar({
  msg,
  isUser,
  onCopy,
  onEdit,
  onRegenerate,
  onDelete,
  onQuote,
}: {
  msg: IChatMessage;
  isUser: boolean;
  onCopy: (msg: IChatMessage) => void;
  onEdit: (msg: IChatMessage) => void;
  onRegenerate: (msg: IChatMessage) => void;
  onDelete: (msg: IChatMessage) => void;
  onQuote: (msg: IChatMessage) => void;
}) {
  return (
    <div
      className={`absolute -top-3 flex items-center gap-0.5 rounded-lg border border-border/40 bg-card px-1 py-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 ${
        isUser ? 'right-0' : 'left-0'
      }`}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onCopy(msg);
              }}
              aria-label="复制"
            >
              <Copy className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">复制</TooltipContent>
        </Tooltip>

        {isUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(msg);
                }}
                aria-label="编辑"
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">编辑</TooltipContent>
          </Tooltip>
        )}

        {!isUser && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerate(msg);
                }}
                aria-label="重新生成"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">重新生成</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onQuote(msg);
              }}
              aria-label="引用"
            >
              <Quote className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">引用</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(msg);
              }}
              aria-label="删除"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">删除</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Quote preview bar (above input)
// ---------------------------------------------------------------------------

function QuotePreviewBar({
  msg,
  onCancel,
}: {
  msg: IChatMessage;
  onCancel: () => void;
}) {
  const isAssistant = msg.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, marginTop: 0 }}
      animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
      exit={{ opacity: 0, height: 0, marginTop: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2 px-3 py-2 rounded-t-xl bg-muted/40 border border-border/30 border-b-0"
    >
      <div
        className={`w-0.5 h-8 shrink-0 rounded-full ${
          isAssistant ? 'bg-primary/50' : 'bg-accent/50'
        }`}
      />
      {isAssistant ? (
        <Bot className="size-3.5 shrink-0 text-muted-foreground" />
      ) : (
        <User className="size-3.5 shrink-0 text-muted-foreground" />
      )}
      <span className="text-[11px] font-medium text-muted-foreground shrink-0">
        {isAssistant ? '助手' : '用户'}
      </span>
      <span className="flex-1 text-xs text-foreground/70 line-clamp-1 truncate min-w-0">
        {msg.content}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-5 w-5 shrink-0 rounded-md text-muted-foreground hover:text-foreground"
        onClick={onCancel}
        aria-label="取消引用"
      >
        <X className="size-3" />
      </Button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Quote block (inside user message bubble)
// ---------------------------------------------------------------------------

function QuoteBlock({
  text,
  onClick,
}: {
  text: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-primary-foreground/10 mb-1.5 ${
        onClick ? 'cursor-pointer hover:bg-primary-foreground/15 transition-colors' : ''
      }`}
    >
      <div className="w-0.5 self-stretch shrink-0 rounded-full bg-primary-foreground/30" />
      <p className="min-w-0 flex-1 text-[11px] leading-snug text-primary-foreground/60 line-clamp-2">
        {text}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session sidebar item
// ---------------------------------------------------------------------------

function SessionItem({
  session,
  isActive,
  onSelect,
  onRename,
  onDelete,
}: {
  session: IChatSession;
  isActive: boolean;
  onSelect: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameInput, setNameInput] = useState(session.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  const handleConfirmRename = useCallback(() => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(session.id, trimmed);
    }
    setRenaming(false);
  }, [nameInput, session.id, session.name, onRename]);

  return (
    <div
      className={`group relative flex items-center gap-2 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${
        isActive
          ? 'bg-primary/10 border border-primary/30'
          : 'border border-transparent hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <MessageSquare className={`size-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />

      <div className="flex-1 min-w-0">
        {renaming ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Input
              ref={inputRef}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className="h-7 text-xs px-2 py-0"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleConfirmRename}
            >
              <Check className="size-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setRenaming(false)}
            >
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <p className={`text-xs truncate ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
            {session.name}
          </p>
        )}
      </div>

      {/* Hover actions */}
      {!renaming && (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setNameInput(session.name);
              setRenaming(true);
            }}
            aria-label="重命名"
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(session.id);
            }}
            aria-label="删除"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const [sessions, setSessions] = useState<IChatSession[]>(loadSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(loadActiveSessionId);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quotingMsg, setQuotingMsg] = useState<IChatMessage | null>(null);
  const { hasToken: tokenReady } = useAgnesToken();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Derive active session & messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];

  // Ensure there's always a default session
  useEffect(() => {
    if (sessions.length === 0) {
      const defaultSession: IChatSession = {
        id: generateId(),
        name: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSessions([defaultSession]);
      setActiveSessionId(defaultSession.id);
      saveSessions([defaultSession]);
      saveActiveSessionId(defaultSession.id);
    } else if (!activeSessionId || !sessions.find((s) => s.id === activeSessionId)) {
      const firstId = sessions[0].id;
      setActiveSessionId(firstId);
      saveActiveSessionId(firstId);
    }
  }, []);

  // Persist sessions on change
  const persistSessions = useCallback((next: IChatSession[]) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  // Update session messages
  const updateSessionMessages = useCallback(
    (sessionId: string, newMessages: IChatMessage[]) => {
      setSessions((prev) => {
        const next = prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: newMessages,
                name: s.name === '新对话' && newMessages.length > 0 ? autoName(newMessages) : s.name,
                updatedAt: Date.now(),
              }
            : s,
        );
        saveSessions(next);
        return next;
      });
    },
    [],
  );

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ---- Session actions ----

  const handleNewSession = useCallback(() => {
    const newSession: IChatSession = {
      id: generateId(),
      name: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    persistSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    saveActiveSessionId(newSession.id);
    setInput('');
    setQuotingMsg(null);
    textareaRef.current?.focus();
  }, [sessions, persistSessions]);

  const handleSelectSession = useCallback((id: string) => {
    setActiveSessionId(id);
    saveActiveSessionId(id);
    setEditingMsgId(null);
    setEditingContent('');
    setQuotingMsg(null);
  }, []);

  const handleRenameSession = useCallback(
    (id: string, name: string) => {
      setSessions((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, name } : s));
        saveSessions(next);
        return next;
      });
    },
    [],
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      if (sessions.length <= 1) {
        // Replace with a fresh empty session
        const newSession: IChatSession = {
          id: generateId(),
          name: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        persistSessions([newSession]);
        setActiveSessionId(newSession.id);
        saveActiveSessionId(newSession.id);
        toast.success('已创建新对话');
        return;
      }
      const next = sessions.filter((s) => s.id !== id);
      persistSessions(next);
      if (activeSessionId === id) {
        const newActive = next[0];
        setActiveSessionId(newActive.id);
        saveActiveSessionId(newActive.id);
      }
      toast.success('会话已删除');
    },
    [sessions, activeSessionId, persistSessions],
  );

  // ---- Message actions ----

  const handleCopy = useCallback(async (msg: IChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败');
    }
  }, []);

  const handleEdit = useCallback((msg: IChatMessage) => {
    setEditingMsgId(msg.id);
    setEditingContent(msg.content);
    setQuotingMsg(null);
  }, []);

  const handleSaveEdit = useCallback(
    (msgId: string) => {
      const trimmed = editingContent.trim();
      if (!trimmed) {
        toast.error('消息内容不能为空');
        return;
      }
      if (!activeSessionId) return;
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          const idx = s.messages.findIndex((m) => m.id === msgId);
          if (idx === -1) return s;
          const updated = [...s.messages];
          updated[idx] = { ...updated[idx], content: trimmed };
          const newMessages = updated.slice(0, idx + 1);
          return { ...s, messages: newMessages, updatedAt: Date.now() };
        });
        saveSessions(next);
        return next;
      });
      setEditingMsgId(null);
      setEditingContent('');
      setInput(trimmed);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    },
    [editingContent, activeSessionId],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingMsgId(null);
    setEditingContent('');
  }, []);

  const handleRegenerate = useCallback(
    async (msg: IChatMessage) => {
      if (streaming || !activeSessionId) return;
      if (!tokenReady) {
        toast.error('请先配置 API Token');
        setSettingsOpen(true);
        return;
      }

      const msgIdx = messages.findIndex((m) => m.id === msg.id);
      if (msgIdx === -1) return;

      const messagesBefore = messages.slice(0, msgIdx);
      updateSessionMessages(activeSessionId, messagesBefore);

      setStreaming(true);
      setStreamingContent('');

      const apiMessages = messagesBefore.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const controller = new AbortController();
      abortRef.current = controller;

      let fullContent = '';

      try {
        const stream = chatCompletion(apiMessages, controller.signal);

        for await (const chunk of stream) {
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        const assistantMsg: IChatMessage = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
        };

        updateSessionMessages(activeSessionId, [...messagesBefore, assistantMsg]);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (fullContent) {
            const assistantMsg: IChatMessage = {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              content: fullContent + '\n\n*[已取消]*',
              timestamp: Date.now(),
            };
            updateSessionMessages(activeSessionId, [...messagesBefore, assistantMsg]);
          }
        } else {
          const errorMsg = err instanceof Error ? err.message : '请求失败，请检查网络连接';
          toast.error(errorMsg);
          const errorAssistantMsg: IChatMessage = {
            id: `${Date.now()}-error`,
            role: 'assistant',
            content: `❌ **错误**: ${errorMsg}`,
            timestamp: Date.now(),
          };
          updateSessionMessages(activeSessionId, [...messagesBefore, errorAssistantMsg]);
        }
      } finally {
        setStreaming(false);
        setStreamingContent('');
        abortRef.current = null;
      }
    },
    [messages, streaming, tokenReady, activeSessionId, updateSessionMessages],
  );

  const handleDelete = useCallback(
    (msg: IChatMessage) => {
      if (!activeSessionId) return;
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== activeSessionId) return s;
          return {
            ...s,
            messages: s.messages.filter((m) => m.id !== msg.id),
            updatedAt: Date.now(),
          };
        });
        saveSessions(next);
        return next;
      });
      toast.success('消息已删除');
    },
    [activeSessionId],
  );

  const handleQuote = useCallback((msg: IChatMessage) => {
    // 如果引用的是当前流式生成的消息，使用 streamingContent
    const isStreamingTarget = streaming && msg.role === 'assistant';
    const quoteContent = isStreamingTarget ? streamingContent : msg.content;
    if (!quoteContent) return;
    setQuotingMsg({ ...msg, content: quoteContent });
    textareaRef.current?.focus();
  }, [streaming, streamingContent]);

  // ---- Send message ----

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || streaming || !activeSessionId) return;

    if (!tokenReady) {
      toast.error('请先配置 API Token');
      setSettingsOpen(true);
      return;
    }

    // 拼接引用内容与用户输入
    let finalContent = trimmed;
    if (quotingMsg) {
      const quoted = quotingMsg.content
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n');
      finalContent = `${quoted}\n${trimmed}`;
    }

    const userMsg: IChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: finalContent,
      timestamp: Date.now(),
      ...(quotingMsg ? { quoteId: quotingMsg.id } : {}),
    };

    const updatedMessages = [...messages, userMsg];
    updateSessionMessages(activeSessionId, updatedMessages);
    setInput('');
    setQuotingMsg(null);
    setStreaming(true);
    setStreamingContent('');

    const apiMessages = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = '';

    try {
      const stream = chatCompletion(apiMessages, controller.signal);

      for await (const chunk of stream) {
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const assistantMsg: IChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now(),
      };

      updateSessionMessages(activeSessionId, [...updatedMessages, assistantMsg]);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (fullContent) {
          const assistantMsg: IChatMessage = {
            id: `${Date.now()}-assistant`,
            role: 'assistant',
            content: fullContent + '\n\n*[已取消]*',
            timestamp: Date.now(),
          };
          updateSessionMessages(activeSessionId, [...updatedMessages, assistantMsg]);
        }
      } else {
        const errorMsg = err instanceof Error ? err.message : '请求失败，请检查网络连接';
        toast.error(errorMsg);
        const errorAssistantMsg: IChatMessage = {
          id: `${Date.now()}-error`,
          role: 'assistant',
          content: `❌ **错误**: ${errorMsg}`,
          timestamp: Date.now(),
        };
        updateSessionMessages(activeSessionId, [...updatedMessages, errorAssistantMsg]);
      }
    } finally {
      setStreaming(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }, [input, quotingMsg, messages, streaming, tokenReady, activeSessionId, updateSessionMessages]);

  // Cancel streaming
  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // Form submit
  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      handleSend();
    },
    [handleSend],
  );

  // Keyboard: Enter to send, Shift+Enter for newline
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full">
      {/* ---- Left: Session sidebar ---- */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 border-r border-border/30 bg-card/40 backdrop-blur-sm flex flex-col overflow-hidden"
          >
            {/* Sidebar header */}
            <div className="shrink-0 flex items-center justify-between px-3 py-3 border-b border-border/20">
              <span className="text-sm font-semibold text-foreground">会话列表</span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleNewSession}
                  aria-label="新建会话"
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="收起侧边栏"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === activeSessionId}
                  onSelect={() => handleSelectSession(session.id)}
                  onRename={handleRenameSession}
                  onDelete={handleDeleteSession}
                />
              ))}
            </div>

            {/* Sidebar footer */}
            <div className="shrink-0 px-3 py-2 border-t border-border/20">
              <p className="text-[10px] text-muted-foreground text-center">
                {sessions.length} 个会话
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ---- Right: Chat area ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page header */}
        <div className="shrink-0 border-b border-border/30 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              {!sidebarOpen && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="展开侧边栏"
                >
                  <MessageSquare className="size-4" />
                </Button>
              )}
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-foreground truncate">
                  {activeSession?.name ?? '文本聊天'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  agnes-2.0-flash · 流式输出
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {hasMessages && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewSession}
                  className="text-muted-foreground hover:text-foreground h-8 text-xs"
                >
                  <Plus className="size-3.5 mr-1" />
                  新对话
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {!hasMessages && !streaming ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-16"
            >
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                <Bot className="size-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                开始对话
              </h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                在下方输入你的问题，agnes-2.0-flash 将为你提供流式回复。
                支持多轮对话，对话历史会自动保存。
              </p>

              {!tokenReady && (
                <Card className="w-full border-warning/30 bg-warning/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-warning-foreground mb-1">
                          未配置 API Token
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          请先配置 API Token 以开始对话体验
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSettingsOpen(true)}
                        >
                          <Key className="size-3.5 mr-1.5" />
                          配置 Token
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick prompts */}
              <div className="mt-8 w-full space-y-2">
                <p className="text-xs text-muted-foreground mb-3">试试这些：</p>
                {[
                  '用 Python 写一个快速排序算法',
                  '解释一下什么是 Transformer 架构',
                  '帮我写一封商务邮件模板',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={!tokenReady}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg border border-border/40 bg-card/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-card transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Messages list */
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isError = msg.content.startsWith('❌');
                  const isEditing = editingMsgId === msg.id;

                  return (
                    <motion.div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Avatar */}
                      {!isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 mt-0.5">
                          <Bot className="size-4 text-primary" />
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`group relative max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : isError
                              ? 'bg-destructive/10 border border-destructive/30 text-foreground rounded-bl-md'
                              : 'bg-card border border-border/40 text-foreground rounded-bl-md'
                        }`}
                      >
                        {isEditing ? (
                          /* Edit mode */
                          <div className="space-y-2">
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="min-h-[60px] text-sm bg-background border-border/40"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSaveEdit(msg.id);
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveEdit(msg.id)}
                                disabled={!editingContent.trim()}
                              >
                                保存并重新发送
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                取消
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {isUser ? (
                              (() => {
                                const { quotedText, bodyText } = parseQuotedContent(msg.content);
                                return (
                                  <>
                                    {quotedText && (
                                      <QuoteBlock
                                        text={quotedText}
                                        onClick={msg.quoteId ? () => {
                                          const el = document.getElementById(`msg-${msg.quoteId}`);
                                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        } : undefined}
                                      />
                                    )}
                                    {bodyText && (
                                      <p className="whitespace-pre-wrap break-words">{bodyText}</p>
                                    )}
                                  </>
                                );
                              })()
                            ) : (
                              <div className="prose-sm prose-invert max-w-none">
                                <MarkdownContent content={msg.content} />
                              </div>
                            )}

                            {/* Timestamp */}
                            <span className={`block mt-1.5 text-[10px] opacity-50 ${isUser ? 'text-right' : 'text-left'}`}>
                              {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </>
                        )}

                        {/* Action toolbar — only when not editing */}
                        {!isEditing && (
                          <MessageToolbar
                            msg={msg}
                            isUser={isUser}
                            onCopy={handleCopy}
                            onEdit={handleEdit}
                            onRegenerate={handleRegenerate}
                            onDelete={handleDelete}
                            onQuote={handleQuote}
                          />
                        )}
                      </div>

                      {/* User avatar */}
                      {isUser && (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/20 mt-0.5">
                          <User className="size-4 text-accent" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Streaming bubble */}
                {streaming && streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 mt-0.5">
                      <Bot className="size-4 text-primary" />
                    </div>
                    <div className="max-w-[85%] md:max-w-[75%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed bg-card border border-border/40 text-foreground">
                      <div className="prose-sm prose-invert max-w-none">
                        <MarkdownContent content={streamingContent} />
                      </div>
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                        <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
                        正在生成...
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Streaming loading (no content yet) */}
                {streaming && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                      <Bot className="size-4 text-primary" />
                    </div>
                    <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border/40">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="inline-block size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="inline-block size-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll-to-bottom FAB */}
        {hasMessages && (
          <div className="relative">
            <button
              type="button"
              onClick={scrollToBottom}
              className="absolute bottom-full right-6 mb-2 flex size-8 items-center justify-center rounded-full bg-card border border-border/40 shadow-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              aria-label="滚动到底部"
            >
              <ArrowDown className="size-4" />
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="shrink-0 border-t border-border/30 bg-background/80 backdrop-blur-md px-4 md:px-6 py-4">
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {/* 引用预览条 */}
            <AnimatePresence>
              {quotingMsg && (
                <QuotePreviewBar
                  msg={quotingMsg}
                  onCancel={() => setQuotingMsg(null)}
                />
              )}
            </AnimatePresence>
            <div className="flex items-end gap-3">
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    tokenReady
                      ? '输入消息，Enter 发送，Shift+Enter 换行...'
                      : '请先配置 API Token...'
                  }
                  disabled={!tokenReady || streaming}
                  rows={1}
                  className={`min-h-[44px] max-h-[160px] resize-none pr-4 bg-card/60 border-border/40 focus:border-primary/50 rounded-xl text-sm ${
                    quotingMsg ? 'rounded-t-none' : ''
                  }`}
                />
              </div>

              {streaming ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCancel}
                  className="shrink-0 h-11 w-11 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                  aria-label="停止生成"
                >
                  <Loader2 className="size-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || !tokenReady}
                  className="shrink-0 h-11 w-11 rounded-xl"
                  aria-label="发送消息"
                >
                  <Send className="size-4" />
                </Button>
              )}
            </div>

            {!tokenReady && (
              <p className="mt-2 text-xs text-muted-foreground text-center">
                请先
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="text-primary hover:underline mx-1"
                >
                  配置 API Token
                </button>
                以开始对话
              </p>
            )}
          </form>
        </div>

        {/* Token settings panel */}
        <TokenSettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
      </div>
    </div>
  );
}
