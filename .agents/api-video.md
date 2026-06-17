# Agnes-Video-V2.0 视频生成模型 — API 接入文档

## API 端点

### 创建视频任务

| 项目         | 描述                                    |
| ------------ | --------------------------------------- |
| 端点         | `https://apihub.agnes-ai.com/v1/videos` |
| 方法         | `POST`                                  |
| Content-Type | `application/json`                      |
| 认证方式     | Bearer Token                            |
| 请求头       | `Authorization: Bearer YOUR_API_KEY`    |

### 获取视频结果：推荐方法

创建视频任务后，响应将包含一个 `video_id`。推荐使用 `video_id` 来获取视频结果。

| 项目     | 描述                                                       |
| -------- | ---------------------------------------------------------- |
| 端点     | `https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>` |
| 方法     | `GET`                                                      |
| 认证方式 | Bearer Token                                               |
| 请求头   | `Authorization: Bearer YOUR_API_KEY`                       |

### 获取视频结果：兼容旧版方法

为了兼容现有集成，旧版任务查询端点仍然受支持。

| 项目     | 描述                                              |
| -------- | ------------------------------------------------- |
| 端点     | `https://apihub.agnes-ai.com/v1/videos/{task_id}` |
| 方法     | `GET`                                             |
| 认证方式 | Bearer Token                                      |
| 请求头   | `Authorization: Bearer YOUR_API_KEY`              |

## 请求参数

### 创建视频任务参数

| 参数                  | 类型           | 必填 | 描述                                        |
| --------------------- | -------------- | ---- | ------------------------------------------- |
| `model`               | string         | 是   | 模型名称。请使用 `agnes-video-v2.0`         |
| `prompt`              | string         | 是   | 视频内容的文本描述                          |
| `image`               | string / array | 否   | 图像 URL 或图像 URL 数组                    |
| `mode`                | string         | 否   | 生成模式，例如 `ti2vid` 或 `keyframes`      |
| `height`              | integer        | 否   | 视频高度。默认值：`768`                     |
| `width`               | integer        | 否   | 视频宽度。默认值：`1152`                    |
| `num_frames`          | integer        | 否   | 视频帧数。必须 `≤ 441` 且遵循 `8n + 1` 规则 |
| `frame_rate`          | number         | 否   | 视频 FPS。支持范围：`1–60`                  |
| `num_inference_steps` | integer        | 否   | 推理步数                                    |
| `seed`                | integer        | 否   | 用于获取可重复结果的随机种子                |
| `negative_prompt`     | string         | 否   | 负向提示词，描述需要避免的内容              |
| `extra_body.image`    | array          | 否   | 用于多图视频或关键帧模式的输入图像 URL      |
| `extra_body.mode`     | string         | 否   | 附加模式设置，例如 `keyframes`              |

### 参数标准化说明

Agnes-Video-V2.0 对某些视频生成参数进行了标准化，以确保生成的稳定性和输出质量的一致性。当提交的 `width`、`height` 或宽高比与模型支持的标准规格不完全匹配时，系统会自动识别最接近的分辨率层级和宽高比，并将请求映射到相应的标准输出尺寸。

该模型目前支持三个标准分辨率层级：`480p`、`720p` 和 `1080p`。推荐以下宽高比：

| 宽高比 | 推荐用途                                                     |
| ------ | ------------------------------------------------------------ |
| `16:9` | 横屏视频、产品演示、网站展示、YouTube 风格内容               |
| `9:16` | 竖屏短视频、移动端优先内容、TikTok / Reels / Shorts 风格内容 |
| `1:1`  | 方形视频、社交媒体信息流、人物或产品展示                     |
| `4:3`  | 传统横屏格式和通用演示内容                                   |
| `3:4`  | 竖屏演示、以人物为主的视频、以产品为主的内容                 |

不同的分辨率和宽高比组合可能对应不同的实际输出尺寸和最大帧数限制。例如，接近 `720p / 16:9` 的输入尺寸将被标准化为相应的标准输出尺寸。

因此，请求中原始的 `width`、`height`、`num_frames` 等参数可能与生成过程中使用的标准化参数不完全相同。在显示任务信息、计算视频时长或排查生成结果时，开发者应以 API 响应返回的 `size`、`seconds` 等字段为准。

## 创建视频任务示例

### 示例 1：文生视频

使用此请求直接从文本提示生成视频。

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "A cinematic shot of a cat walking on the beach at sunset, soft ocean waves, warm golden lighting, realistic motion",
    "height": 768,
    "width": 1152,
    "num_frames": 121,
    "frame_rate": 24
  }'
```

### 示例 2：图生视频

使用此请求为单张图像添加动画效果。

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "The woman slowly turns around and looks back at the camera, natural facial expression, cinematic camera movement",
    "image": "https://example.com/image.png",
    "num_frames": 121,
    "frame_rate": 24
  }'
```

### 示例 3：多图视频生成

使用此请求生成由多张输入图像引导的视频。

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "Create a smooth transformation scene between the two reference images, cinematic lighting, consistent character identity, natural motion",
    "extra_body": {
      "image": [
        "https://example.com/image1.png",
        "https://example.com/image2.png"
      ]
    },
    "num_frames": 121,
    "frame_rate": 24
  }'
```

### 示例 4：关键帧动画

使用此请求在多个关键帧之间生成平滑的动画。

```bash
curl -X POST https://apihub.agnes-ai.com/v1/videos \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-video-v2.0",
    "prompt": "Generate a smooth cinematic transition between the keyframes, maintaining visual consistency and natural camera movement",
    "extra_body": {
      "image": [
        "https://example.com/keyframe1.png",
        "https://example.com/keyframe2.png"
      ],
      "mode": "keyframes"
    },
    "num_frames": 121,
    "frame_rate": 24
  }'
```

## 创建任务响应

视频任务创建成功后，API 返回任务信息。响应同时包含 `task_id` 和 `video_id`。推荐使用 `video_id` 来获取视频结果。

```json
{
  "id": "task_YOUR_TASK_ID",
  "task_id": "task_YOUR_TASK_ID",
  "video_id": "video_YOUR_VIDEO_ID",
  "object": "video",
  "model": "agnes-video-v2.0",
  "status": "queued",
  "progress": 0,
  "created_at": 1780457477,
  "seconds": "10.0",
  "size": "1280x768"
}
```

### 响应字段

| 字段         | 类型    | 描述                              |
| ------------ | ------- | --------------------------------- |
| `id`         | string  | 任务 ID。可与旧版查询端点配合使用 |
| `task_id`    | string  | 任务 ID。与 `id` 作用相同         |
| `video_id`   | string  | 视频 ID。推荐用于获取视频结果     |
| `object`     | string  | 对象类型，通常为 `video`          |
| `model`      | string  | 当前任务使用的模型                |
| `status`     | string  | 当前任务状态                      |
| `progress`   | integer | 当前任务进度百分比                |
| `created_at` | integer | 任务创建时间戳                    |
| `seconds`    | string  | 视频时长（秒）                    |
| `size`       | string  | 视频分辨率                        |

## 获取视频结果

### 推荐方法：通过 `video_id` 获取

创建视频任务后，使用返回的 `video_id` 获取视频结果。

```bash
curl --location --request GET 'https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>' \
  --header 'Authorization: Bearer <API_KEY>'
```

示例：

```bash
curl --location --request GET 'https://apihub.agnes-ai.com/agnesapi?video_id=video_xxxxxx' \
  --header 'Authorization: Bearer <API_KEY>'
```

### 可选参数：`model_name`

获取视频结果时，您还可以传递 `model_name` 以明确指定模型名称。

```bash
curl --location --request GET 'https://apihub.agnes-ai.com/agnesapi?video_id=<VIDEO_ID>&model_name=<MODEL>' \
  --header 'Authorization: Bearer <API_KEY>'
```

### 兼容旧版方法：通过 `task_id` 获取

为了兼容旧版本，您仍然可以使用 `task_id` 获取视频结果。

```bash
curl --location --request GET 'https://apihub.agnes-ai.com/v1/videos/<TASK_ID>' \
  --header 'Authorization: Bearer <API_KEY>'
```

## 获取结果响应

当任务完成时，API 返回最终的视频结果。

```json
{
  "id": "task_YOUR_TASK_ID",
  "video_id": "video_YOUR_VIDEO_ID",
  "model": "agnes-video-v2.0",
  "object": "video",
  "status": "completed",
  "progress": 100,
  "seconds": "10.0",
  "size": "1280x768",
  "remixed_from_video_id": "https://storage.googleapis.com/agnes-aigc/aigc/videos/2026/06/03/video_xxxxxx.mp4",
  "error": null
}
```

### 结果字段

| 字段                    | 类型          | 描述                                                    |
| ----------------------- | ------------- | ------------------------------------------------------- |
| `id`                    | string        | 任务 ID                                                 |
| `video_id`              | string        | 视频 ID                                                 |
| `model`                 | string        | 当前任务使用的模型                                      |
| `object`                | string        | 对象类型                                                |
| `status`                | string        | 任务状态                                                |
| `progress`              | integer       | 任务进度百分比                                          |
| `seconds`               | string        | 视频时长（秒）                                          |
| `size`                  | string        | 视频分辨率                                              |
| `remixed_from_video_id` | string        | 最终生成的视频 URL。仅在 `status` 为 `completed` 时可用 |
| `error`                 | object / null | 任务失败时返回的错误信息                                |

## 注意事项

- 使用 `agnes-video-v2.0` 作为模型名称。
- 视频生成是异步的。
- 您需要先创建视频任务，然后再获取视频结果。
- 创建任务的响应会同时返回 `task_id` 和 `video_id`。
- 新的集成应使用 `video_id` 来获取视频结果。
- 旧版的 `task_id` 查询端点仍然受支持。
- `video_url`（即 `remixed_from_video_id`）仅在 `status` 为 `completed` 时可用。
- `num_frames` 必须小于或等于 `441`。
- `num_frames` 必须遵循 `8n + 1` 规则，例如 `81`、`121`、`161`、`241` 或 `441`。
- 文生视频任务仅需 `model` 和 `prompt`。
- 图生视频任务需要通过 `image` 提供图像 URL。
- 多图视频任务需要在 `extra_body.image` 中提供多个图像 URL。
- 关键帧动画需要将 `extra_body.mode` 设置为 `keyframes`。
