// EXPORTS: IAssetItem, AssetType, ImageGenParams, VideoGenParams, AssetFilter, AssetSortKey

// ---------------------------------------------------------------------------
// 资产类型枚举
// ---------------------------------------------------------------------------

export type AssetType = 'image' | 'video';

// ---------------------------------------------------------------------------
// 图像生成参数
// ---------------------------------------------------------------------------

export interface ImageGenParams {
  /** 尺寸：1:1 / 16:9 / 9:16 / 4:3 / 3:4 */
  size: '1024x1024' | '1792x1024' | '1024x1792' | '1152x896' | '896x1152';
  /** 生成数量 1-4 */
  n: number;
  /** 质量档位 */
  quality: 'standard' | 'hd' | 'ultra';
  /** 随机种子，留空则随机 */
  seed: number | null;
  /** 引导系数 3-20 */
  guidanceScale: number;
  /** 输出格式 */
  responseFormat: 'url' | 'b64_json';
}

// ---------------------------------------------------------------------------
// 视频生成参数
// ---------------------------------------------------------------------------

export interface VideoGenParams {
  /** 分辨率 */
  resolution: '480p' | '720p' | '1080p';
  /** 时长（秒） */
  duration: 5 | 10 | 16;
  /** 运动强度 1-10 */
  motionStrength: number;
  /** 帧率 */
  fps: 24 | 30;
  /** 随机种子，留空则随机 */
  seed: number | null;
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
