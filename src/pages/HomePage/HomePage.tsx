import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Image,
  Video,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  Brain,
  Palette,
  Film,
  Circle,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image as Img } from '@/components/ui/image';
import TokenSettingsPanel from '@/components/TokenSettingsPanel';
import { useAgnesToken } from '@/hooks/useAgnesToken';
import AgnesLogo from '@/components/AgnesLogo';

const CAPABILITY_CARDS = [
  {
    icon: MessageSquare,
    title: '文本生成与推理',
    subtitle: 'agnes-2.0-flash',
    description:
      '高效语言模型，支持多轮对话、代码生成、文本分析等场景。流式输出，响应迅速，助你快速构建智能对话体验。',
    image: '/langding2.png',
    features: ['多轮对话', '流式输出', '代码理解', '128K 上下文'],
    route: '/chat',
    gradient: 'from-primary/20 via-primary/5 to-transparent',
    iconBg: 'bg-primary/15 text-primary',
  },
  {
    icon: Image,
    title: '图像生成与编辑',
    subtitle: 'agnes-image-2.1-flash',
    description:
      '高性能图像生成模型，文本描述即可创作精美图片。支持多种风格，分辨率高达 1024×1024，创意无限。',
    image: '/langding3.png',
    features: ['文生图', '高分辨率', '多风格', '快速生成'],
    route: '/image-gen',
    gradient: 'from-accent/20 via-accent/5 to-transparent',
    iconBg: 'bg-accent/15 text-accent',
  },
  {
    icon: Video,
    title: '音视频同步生成',
    subtitle: 'agnes-video-v2.0',
    description:
      '电影级视频生成模型，文本描述即可创作高质量视频内容。支持多种画幅比例，画面流畅自然。',
    image: '/lanlangding4.png',
    features: ['文生视频', '电影级画质', '多画幅', '流畅运镜'],
    route: '/video-gen',
    gradient: 'from-chart-3/20 via-chart-3/5 to-transparent',
    iconBg: 'bg-chart-3/15 text-chart-3',
  },
];

const HIGHLIGHTS = [
  { icon: Zap, label: '极速响应', desc: '毫秒级推理延迟' },
  { icon: Shield, label: '安全可靠', desc: '企业级数据保护' },
  { icon: Sparkles, label: '前沿模型', desc: '持续迭代更新' },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TokenBanner({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { hasToken } = useAgnesToken();

  if (hasToken) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-warning/10 border-b border-warning/20"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Circle className="size-2 shrink-0 fill-warning text-warning" />
          <span className="text-sm text-warning-foreground/90 truncate">
            👋 请先配置 API Token 以开始体验
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 border-warning/30 text-warning-foreground hover:bg-warning/10"
          onClick={onOpenSettings}
        >
          <Settings className="size-3.5 mr-1.5" />
          配置
        </Button>
      </div>
    </motion.div>
  );
}

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="w-full relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,hsl(250_75%_60%/0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_80%,hsl(180_80%_50%/0.08),transparent)]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(250_75%_60%) 1px, transparent 1px), linear-gradient(90deg, hsl(250_75%_60%) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-6"
          >
            <Badge variant="outline" className="border-primary/30 text-primary text-xs px-3 py-1">
              <Sparkles className="size-3 mr-1.5" />
              Agnes AI 在线演示平台
            </Badge>

            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <AgnesLogo size={48} showText />
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              探索{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-chart-3 bg-clip-text text-transparent">
                Agnes AI
              </span>
              <br />
              三大核心模型能力
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
              一站式体验文本生成、图像创作与视频合成的前沿 AI 技术。
              无需复杂配置，输入 API Token 即可开始。
            </p>

            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-xl shadow-lg shadow-primary/25"
                onClick={() => navigate('/chat')}
              >
                开始体验
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => {
                  document.getElementById('capabilities')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                了解能力
              </Button>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap gap-4 pt-4">
              {HIGHLIGHTS.map((h) => (
                <div key={h.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <h.icon className="size-4 text-primary/70" />
                  <span className="font-medium text-foreground/80">{h.label}</span>
                  <span className="hidden sm:inline">· {h.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-primary/10">
              <video
                src="/agnesdemo.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full aspect-[21/9] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>

            {/* Floating glow */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/10 to-chart-3/20 rounded-3xl blur-3xl -z-10 opacity-50" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const navigate = useNavigate();

  return (
    <section id="capabilities" className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-12 md:mb-16"
        >
          <Badge variant="outline" className="border-primary/20 text-primary text-xs">
            核心能力
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            三大模型，{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              无限可能
            </span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            从文本对话到视觉创作，Agnes AI 为你的每一个创意提供强大的模型支持
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {CAPABILITY_CARDS.map((card, i) => (
            <motion.div
              key={card.route}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="group relative overflow-hidden border-border/30 bg-card/60 backdrop-blur-sm hover:border-primary/20 transition-all duration-500 h-full flex flex-col">
                {/* Gradient accent top bar */}
                <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${card.gradient}`} />

                {/* Image */}
                <div className="relative overflow-hidden">
                  <Img
                    src={card.image}
                    alt={card.title}
                    className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
                    >
                      <card.icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                      <CardDescription className="text-xs font-mono text-primary/80">
                        {card.subtitle}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col gap-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>

                  {/* Feature tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {card.features.map((f) => (
                      <Badge
                        key={f}
                        variant="secondary"
                        className="text-[11px] px-2 py-0.5 bg-muted/50"
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="mt-auto pt-2">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl group/btn border-border/40 hover:border-primary/30"
                      onClick={() => navigate(card.route)}
                    >
                      <span>立即体验</span>
                      <ArrowRight className="size-4 ml-1.5 transition-transform duration-300 group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoVideoSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            看看 Agnes 能做什么
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            从文字描述到精美视频，一键生成创意内容
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="relative group"
        >
          <div className="rounded-2xl overflow-hidden border border-border/40 shadow-2xl shadow-primary/5 bg-card">
            <video
              src="/agnesdemo.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full aspect-video object-cover"
            />
          </div>
          <div className="absolute -inset-6 bg-gradient-to-r from-primary/10 via-accent/5 to-chart-3/10 rounded-3xl blur-3xl -z-10 opacity-40 group-hover:opacity-60 transition-opacity duration-700" />
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: '3', unit: '大模型', label: '覆盖文本/图像/视频', icon: Brain },
    { value: '128K', unit: '', label: '上下文窗口', icon: Zap },
    { value: '1024', unit: 'px', label: '图像生成分辨率', icon: Palette },
    { value: '电影级', unit: '', label: '视频生成质量', icon: Film },
  ];

  return (
    <section className="w-full py-16 md:py-20 border-y border-border/20 bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center space-y-2"
            >
              <div className="flex justify-center">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <stat.icon className="size-5" />
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold tracking-tight tabular-nums">
                {stat.value}
                {stat.unit && (
                  <span className="text-lg md:text-xl font-normal text-muted-foreground ml-0.5">
                    {stat.unit}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br from-primary/10 via-card to-accent/5 p-8 md:p-12 text-center"
        >
          {/* Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-5 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              准备好开始了吗？
            </h2>
            <p className="text-muted-foreground">
              配置 API Token，即刻体验 Agnes AI 的强大能力。无需复杂部署，打开浏览器即可开始。
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="rounded-xl shadow-lg shadow-primary/25"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="size-4 mr-1.5" />
                开始对话
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => navigate('/image-gen')}
              >
                <Image className="size-4 mr-1.5" />
                生成图片
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => navigate('/video-gen')}
              >
                <Video className="size-4 mr-1.5" />
                生成视频
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Token banner */}
      <TokenBanner onOpenSettings={() => setSettingsOpen(true)} />

      <main className="space-y-0">
        <HeroSection />
        <CapabilitiesSection />
        <StatsSection />
        <CTASection />
      </main>

      {/* Settings panel */}
      <TokenSettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
