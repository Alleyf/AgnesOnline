# Agnes-Image-2.1-Flash 图像生成模型 — API 接入文档

## API 信息

| 项目         | 描述                                                |
| ------------ | --------------------------------------------------- |
| API 端点     | `https://apihub.agnes-ai.com/v1/images/generations` |
| 请求方法     | `POST`                                              |
| Content-Type | `application/json`                                  |
| 认证方式     | Bearer Token                                        |
| 认证请求头   | `Authorization: Bearer YOUR_API_KEY`                |

## 模型名称

文生图和图生图工作流均使用以下模型名称：

```plain
agnes-image-2.1-flash
```

## 重要注意事项

- 使用 `agnes-image-2.1-flash` 作为模型名称。
- 对于文生图生成，`model`、`prompt` 和 `size` 为必填项。
- 对于图生图生成，请在顶层 `image` 数组中提供输入图像的 URL 或 Data URI Base64。
- **不要**将 `response_format` 放在请求体的顶层。
- 如果需要 URL 输出，请将 `"response_format": "url"` 放在 `extra_body` 内部。
- 如果需要文生图输出 Base64，可以使用顶层参数 `"return_base64": true`。
- 对于图生图的 Base64 输出，请在 `extra_body` 内部使用 `"response_format": "b64_json"`。
- 图生图请求不需要传递 `tags: ["img2img"]`。
- 不要在公共文档中暴露临时 API 密钥。在所有公共示例中请使用 `YOUR_API_KEY`。

## 请求参数

| 参数                         | 类型     | 必填       | 描述                                              |
| ---------------------------- | -------- | ---------- | ------------------------------------------------- |
| `model`                      | string   | 是         | 模型名称。请使用 `agnes-image-2.1-flash`          |
| `prompt`                     | string   | 是         | 用于图像生成或编辑的文本指令                      |
| `size`                       | string   | 是         | 输出图像尺寸，例如 `1024x768`                     |
| `image`                      | string[] | 图生图必填 | 输入图像数组。支持公开图像 URL 或 Data URI Base64 |
| `return_base64`              | boolean  | 否         | 当文生图输出需要以 Base64 返回时使用              |
| `extra_body`                 | object   | 否         | 用于高级工作流的附加参数                          |
| `extra_body.response_format` | string   | 否         | 输出格式。常用值：`url`、`b64_json`               |

## 调用示例

### 1. 文生图请求（URL 输出）

使用此请求从文本提示生成图像，并以图像 URL 形式返回结果。

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "A luminous floating city above a misty canyon at sunrise, cinematic realism",
    "size": "1024x768",
    "extra_body": {
      "response_format": "url"
    }
  }'
```

生成的图像 URL 返回在：`data[0].url`

### 2. 文生图请求（Base64 输出）

当您希望生成的图像以 Base64 数据形式返回时，使用此请求。

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "A clean product photo of a glass cube on a white studio background, soft shadows, high detail",
    "size": "1024x768",
    "return_base64": true
  }'
```

生成的 Base64 图像返回在：`data[0].b64_json`

### 3. 图生图请求（URL 输入 + URL 输出）

使用此请求转换现有图像，同时保留原始构图。

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "Transform the scene into a rain-soaked cyberpunk night with neon reflections while preserving the original composition",
    "size": "1024x768",
    "extra_body": {
      "image": [
        "https://example.com/input-image.png"
      ],
      "response_format": "url"
    }
  }'
```

生成的图像 URL 返回在：`data[0].url`

### 4. 图生图请求（URL 输入 + Base64 输出）

当输入图像为公开 URL 且生成结果需要以 Base64 数据形式返回时，使用此请求。

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "Make the object orange while preserving the original composition",
    "size": "1024x768",
    "extra_body": {
      "image": [
        "https://example.com/input-image.png"
      ],
      "response_format": "b64_json"
    }
  }'
```

生成的 Base64 图像返回在：`data[0].b64_json`

### 5. 图生图请求（Data URI Base64 输入）

图生图同样支持 Data URI Base64 输入。

Data URI 格式：
```plain
data:image/png;base64,BASE64_HERE
```

请求示例：

```bash
curl https://apihub.agnes-ai.com/v1/images/generations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-image-2.1-flash",
    "prompt": "Make the object matte black while preserving the original composition",
    "size": "1024x768",
    "extra_body": {
      "image": [
        "data:image/png;base64,BASE64_HERE"
      ],
      "response_format": "b64_json"
    }
  }'
```

## 响应格式

### URL 输出

当 `extra_body.response_format` 设置为 `url` 时，响应格式如下：

```json
{
  "created": 1780000000,
  "data": [
    {
      "url": "https://storage.googleapis.com/agnes-aigc/xxx.png",
      "b64_json": null,
      "revised_prompt": null
    }
  ]
}
```

### Base64 输出

当启用 Base64 输出时，响应格式如下：

```json
{
  "created": 1780000000,
  "data": [
    {
      "url": null,
      "b64_json": "iVBORw0KGgoAAAANSUhEUgAA...",
      "revised_prompt": null
    }
  ]
}
```
