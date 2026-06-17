// EXPORTS: getToken, setToken, clearToken, hasToken, chatCompletion, generateImage, generateVideo, type IChatMessage, type IImageResult, type IVideoResult, type IImageGenParams, type IVideoGenParams, type IAssetItem, type IAssetStore

import { toast } from 'sonner';
import { logger, scopedStorage } from '@lark-apaas/client-toolkit-lite';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface IImageResult {
  id: string;
  prompt: string;
  url: string;
  revisedPrompt?: string;
  timestamp: number;
  params?: IImageGenParams;
}

export interface IVideoResult {
  id: string;
  prompt: string;
  url: string;
  timestamp: number;
  taskId?: string;
  params?: IVideoGenParams;
}

export interface IImageGenParams {
  size: '1024x1024' | '1792x1024' | '1024x1792' | '1152x896' | '896x1152';
  n: number;
  quality: 'standard' | 'hd';
  seed?: number;
  guidanceScale: number;
}

export interface IVideoGenParams {
  resolution: '480p' | '720p' | '1080p';
  duration: 5 | 10 | 16;
  motionStrength: 'low' | 'medium' | 'high';
  fps: 24 | 30;
  seed?: number;
}

export type AssetType = 'image' | 'video';

export interface IAssetItem {
  id: string;
  type: AssetType;
  prompt: string;
  url: string;
  timestamp: number;
  params?: IImageGenParams | IVideoGenParams;
}

export interface IAssetStore {
  items: IAssetItem[];
  updatedAt: number;
}

/** 视频生成轮询进度 */
// ---------------------------------------------------------------------------
// Token management (scopedStorage)
// ---------------------------------------------------------------------------

const TOKEN_KEY = '__agnes_demo_token';
const BASE_URL = 'https://apihub.agnes-ai.com/v1';

export function getToken(): string | null {
  try {
    const t = scopedStorage.getItem(TOKEN_KEY);
    return t || null;
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  try {
    scopedStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    logger.error('Failed to save token:', String(e));
  }
}

export function clearToken(): void {
  try {
    scopedStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    logger.error('Failed to clear token:', String(e));
  }
}

export function hasToken(): boolean {
  const t = getToken();
  return t !== null && t.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) {
    throw new Error('API Token 未配置，请先在设置面板中配置 Token');
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ---------------------------------------------------------------------------
// Chat Completion (streaming)
// ---------------------------------------------------------------------------

export async function* chatCompletion(
  messages: Array<{ role: string; content: string }>,
  signal?: AbortSignal,
): AsyncGenerator<string, void, unknown> {
  const headers = getAuthHeaders();

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'agnes-2.0-flash',
      messages,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let errorMsg = `请求失败 (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMsg = parsed?.error?.message || errorMsg;
      if (errorMsg.includes('无可用渠道') || errorMsg.includes('no available channel')) {
        errorMsg = `${errorMsg}。请检查模型名称是否正确，或服务暂时不可用`;
      }
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed?.choices?.[0]?.delta?.content;
          if (delta) {
            yield delta;
          }
        } catch {
          // skip malformed chunks
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Image Generation (with advanced params)
// ---------------------------------------------------------------------------

export async function generateImage(
  prompt: string,
  signal?: AbortSignal,
  params?: Partial<IImageGenParams>,
): Promise<IImageResult> {
  const headers = getAuthHeaders();

  const mergedParams: IImageGenParams = {
    size: params?.size ?? '1024x1024',
    n: params?.n ?? 1,
    quality: params?.quality ?? 'standard',
    guidanceScale: params?.guidanceScale ?? 7.5,
    ...(params?.seed !== undefined && params.seed !== null ? { seed: params.seed } : {}),
  };

  const body: Record<string, unknown> = {
    model: 'agnes-image-2.1-flash',
    prompt,
    n: mergedParams.n,
    size: mergedParams.size,
    quality: mergedParams.quality,
  };

  if (mergedParams.seed !== undefined) {
    body.seed = mergedParams.seed;
  }
  if (mergedParams.guidanceScale !== 7.5) {
    body.guidance_scale = mergedParams.guidanceScale;
  }

  logger.info('[Agnes] 图像生成请求:', { prompt: prompt.slice(0, 80), size: mergedParams.size, n: mergedParams.n });

  const response = await fetch(`${BASE_URL}/images/generations`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    let errorMsg = `图像生成失败 (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMsg = parsed?.error?.message || errorMsg;
    } catch {
      // ignore
    }
    logger.error('[Agnes] 图像生成失败:', errorMsg);
    throw new Error(errorMsg);
  }

  const data = await response.json();
  logger.info('[Agnes] 图像生成响应:', JSON.stringify(data).slice(0, 500));

  const imageUrl = data?.data?.[0]?.url ?? data?.data?.[0]?.b64_json;
  if (!imageUrl) {
    logger.error('[Agnes] 图像生成: API 未返回图片数据', JSON.stringify(data).slice(0, 300));
    throw new Error('API 未返回图片数据');
  }

  return {
    id: generateId(),
    prompt,
    url: imageUrl,
    revisedPrompt: data?.data?.[0]?.revised_prompt,
    timestamp: Date.now(),
    params: mergedParams,
  };
}

// ---------------------------------------------------------------------------
// Video Generation (synchronous, direct response)
// ---------------------------------------------------------------------------

/** 视频生成超时时间 (ms) */
const VIDEO_TIMEOUT = 300_000;

/** 轮询间隔 (ms) */
const VIDEO_POLL_INTERVAL = 3_000;

/**
 * 生成视频 — 异步任务模式。
 * 1. POST /video/generations 提交任务，获取 task_id
 * 2. 轮询 GET /video/generations/{task_id} 直到 status=completed 或 failed
 * 3. 返回视频 URL
 *
 * @param prompt     视频描述文本
 * @param signal     AbortSignal，用于取消请求
 * @param params     高级参数
 * @param onProgress 进度回调 (0-100)
 */
export async function generateVideo(
  prompt: string,
  signal?: AbortSignal,
  params?: Partial<IVideoGenParams>,
  onProgress?: (progress: number, status: string) => void,
): Promise<IVideoResult> {
  const headers = getAuthHeaders();

  const mergedParams: IVideoGenParams = {
    resolution: params?.resolution ?? '720p',
    duration: params?.duration ?? 5,
    motionStrength: params?.motionStrength ?? 'medium',
    fps: params?.fps ?? 24,
    ...(params?.seed !== undefined && params.seed !== null ? { seed: params.seed } : {}),
  };

  const body: Record<string, unknown> = {
    model: 'agnes-video-v2.0',
    prompt,
    resolution: mergedParams.resolution,
    duration: mergedParams.duration,
    motion_strength: mergedParams.motionStrength,
    fps: mergedParams.fps,
  };

  if (mergedParams.seed !== undefined) {
    body.seed = mergedParams.seed;
  }

  logger.info('[Agnes] 视频生成请求:', { prompt: prompt.slice(0, 80), resolution: mergedParams.resolution, duration: mergedParams.duration });

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), VIDEO_TIMEOUT);

  const combinedSignal = signal
    ? combineAbortSignals(signal, timeoutController.signal)
    : timeoutController.signal;

  try {
    // Step 1: 提交任务
    const createResponse = await fetch(`${BASE_URL}/video/generations`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: combinedSignal,
    });

    if (!createResponse.ok) {
      const errorBody = await createResponse.text().catch(() => '');
      let errorMsg = `视频生成失败 (${createResponse.status})`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed?.error?.message || errorMsg;
      } catch {
        // ignore
      }
      logger.error('[Agnes] 视频生成失败:', errorMsg);
      throw new Error(errorMsg);
    }

    const createData = await createResponse.json();
    logger.info('[Agnes] 视频任务已提交:', JSON.stringify(createData).slice(0, 800));

    const taskId: string | undefined = createData?.task_id ?? createData?.id;
    if (!taskId) {
      // 同步返回（兼容旧版 API 直接返回 URL）
      const videoUrl: string | undefined =
        createData?.data?.[0]?.url ??
        createData?.output?.url ??
        createData?.url ??
        createData?.data?.url ??
        createData?.video_url;
      if (!videoUrl) {
        logger.error('[Agnes] 视频生成: API 未返回 task_id 或视频 URL', JSON.stringify(createData).slice(0, 500));
        throw new Error('API 未返回任务 ID 或视频 URL');
      }
      return {
        id: generateId(),
        prompt,
        url: videoUrl,
        timestamp: Date.now(),
        params: mergedParams,
      };
    }

    // Step 2: 轮询任务状态
    onProgress?.(0, 'queued');
    const startTime = Date.now();

    while (true) {
      if (combinedSignal.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, VIDEO_POLL_INTERVAL);
        const onAbort = () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        };
        combinedSignal.addEventListener('abort', onAbort, { once: true });
      });

      const pollResponse = await fetch(`${BASE_URL}/video/generations/${taskId}`, {
        method: 'GET',
        headers,
        signal: combinedSignal,
      });

      if (!pollResponse.ok) {
        const errorBody = await pollResponse.text().catch(() => '');
        logger.error('[Agnes] 视频任务查询失败:', errorBody);
        throw new Error(`查询任务状态失败 (${pollResponse.status})`);
      }

      const pollData = await pollResponse.json();
      const status: string = pollData?.status ?? '';
      const progress: number = typeof pollData?.progress === 'number' ? pollData.progress : 0;

      logger.info('[Agnes] 视频任务状态:', { taskId, status, progress, elapsed: `${((Date.now() - startTime) / 1000).toFixed(0)}s` });
      onProgress?.(progress, status);

      if (status === 'completed') {
        const videoUrl: string | undefined =
          pollData?.data?.[0]?.url ??
          pollData?.output?.url ??
          pollData?.url ??
          pollData?.data?.url ??
          pollData?.video_url ??
          pollData?.result?.url;

        if (!videoUrl) {
          logger.error('[Agnes] 视频任务已完成但未返回 URL:', JSON.stringify(pollData).slice(0, 500));
          throw new Error('视频任务已完成，但未返回视频 URL');
        }

        logger.info('[Agnes] 视频生成完成:', { taskId, url: videoUrl.slice(0, 80) });
        return {
          id: generateId(),
          prompt,
          url: videoUrl,
          timestamp: Date.now(),
          taskId,
          params: mergedParams,
        };
      }

      if (status === 'failed' || status === 'error') {
        const errorMsg = pollData?.error?.message ?? pollData?.message ?? '视频生成任务失败';
        logger.error('[Agnes] 视频任务失败:', errorMsg);
        throw new Error(errorMsg);
      }

      // 超时检查
      if (Date.now() - startTime > VIDEO_TIMEOUT) {
        throw new Error(`视频生成超时（已等待 ${VIDEO_TIMEOUT / 1000} 秒），请稍后重试`);
      }
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (timeoutController.signal.aborted && !signal?.aborted) {
        throw new Error(`视频生成超时（已等待 ${VIDEO_TIMEOUT / 1000} 秒），请稍后重试`);
      }
      throw err;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** 合并两个 AbortSignal */
function combineAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  if (a.aborted || b.aborted) controller.abort();
  return controller.signal;
}

// ---------------------------------------------------------------------------
// Asset Store (scopedStorage persistence)
// ---------------------------------------------------------------------------

const ASSET_STORE_KEY = '__agnes_demo_asset_store';

export function loadAssets(): IAssetStore {
  try {
    const raw = scopedStorage.getItem(ASSET_STORE_KEY);
    if (!raw) return { items: [], updatedAt: 0 };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
    };
  } catch {
    return { items: [], updatedAt: 0 };
  }
}

export function saveAssets(store: IAssetStore): void {
  try {
    scopedStorage.setItem(ASSET_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    logger.error('Failed to save asset store:', String(e));
  }
}

export function addAssetToStore(item: IAssetItem): void {
  const store = loadAssets();
  store.items.unshift(item);
  store.updatedAt = Date.now();
  saveAssets(store);
}

export function removeAssetFromStore(id: string): void {
  const store = loadAssets();
  store.items = store.items.filter((i) => i.id !== id);
  store.updatedAt = Date.now();
  saveAssets(store);
}

export function removeAssetsFromStore(ids: string[]): void {
  const store = loadAssets();
  const idSet = new Set(ids);
  store.items = store.items.filter((i) => !idSet.has(i.id));
  store.updatedAt = Date.now();
  saveAssets(store);
}

export function clearAssetStore(): void {
  saveAssets({ items: [], updatedAt: Date.now() });
}
