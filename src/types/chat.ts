// EXPORTS: IChatMessage, IImageGenRecord, IVideoGenRecord

/** 聊天消息 */
export interface IChatMessage {
  /** 消息唯一 ID */
  id: string;
  /** 角色：user 或 assistant */
  role: 'user' | 'assistant';
  /** 消息文本内容 */
  content: string;
  /** 消息时间戳 */
  timestamp: number;
}

/** 图像生成记录 */
export interface IImageGenRecord {
  /** 记录唯一 ID */
  id: string;
  /** 用户输入的提示词 */
  prompt: string;
  /** 生成结果图片 URL */
  imageUrl: string;
  /** 生成时间戳 */
  timestamp: number;
}

/** 视频生成记录 */
export interface IVideoGenRecord {
  /** 记录唯一 ID */
  id: string;
  /** 用户输入的文本描述 */
  prompt: string;
  /** 生成结果视频 URL */
  videoUrl: string;
  /** 生成时间戳 */
  timestamp: number;
}
