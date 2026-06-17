// EXPORTS: IAssetItem, AssetType, ImageGenParams, VideoGenParams, AssetFilter, AssetSortKey

// ---------------------------------------------------------------------------
// 资产类型枚举
// ---------------------------------------------------------------------------

export type AssetType = 'image' | 'video';

// ---------------------------------------------------------------------------
// 图像生成参数（遵循 .agents/api-image.md 契约）
// ---------------------------------------------------------------------------

export interface ImageGenParams {
  /** 尺寸 */
  size: '1024x1024' | '1792x1024' | '1024x1792' | '1152x896' | '896x1152';
  /** 生成数量 1-4（通过并发请求实现，非 API 参数） */
  n: number;
  /** 随机种子，留空则随机 */
  seed: number | null;
}

// ---------------------------------------------------------------------------
// 视频生成参数（遵循 .agents/api-video.md 契约）
// ---------------------------------------------------------------------------

export interface VideoGenParams {
  /** 视频宽度 */
  width: number;
  /** 视频高度 */
  height: number;
  /** 视频帧数，必须 ≤ 441 且遵循 8n+1 规则 */
  numFrames: number;
  /** 帧率 1-60 */
  frameRate: number;
  /** 随机种子，留空则随机 */
  seed: number | null;
  /** 负向提示词 */
  negativePrompt?: string;
}

// ---------------------------------------------------------------------------
// 统一资产条目
// ---------------------------------------------------------------------------

export interface IAssetItem {
  /** 资产唯一 ID */
  id: string;
  /** 资产类型 */
  type: AssetType;
  /** 生成提示词 */
  prompt: string;
  /** 资源 URL */
  url: string;
  /** 生成时间戳 */
  timestamp: number;
  /** 图像生成参数（仅 image 类型） */
  imageParams?: ImageGenParams;
  /** 视频生成参数（仅 video 类型） */
  videoParams?: VideoGenParams;
  /** 修正后的提示词（仅 image 类型，API 返回） */
  revisedPrompt?: string;
}

// ---------------------------------------------------------------------------
// 资产筛选与排序
// ---------------------------------------------------------------------------

export interface AssetFilter {
  /** 类型筛选：all / image / video */
  type: AssetType | 'all';
  /** 关键词搜索 */
  keyword: string;
}

export type AssetSortKey = 'newest' | 'oldest';
