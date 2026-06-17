# Agnes-2.0-Flash 对话与多模态模型 — API 接入文档

## API 信息

| 项目         | 描述                                              |
| ------------ | ------------------------------------------------- |
| API 端点     | `https://apihub.agnes-ai.com/v1/chat/completions` |
| 请求方法     | `POST`                                            |
| Content-Type | `application/json`                                |
| 认证方式     | Bearer Token                                      |
| 认证请求头   | `Authorization: Bearer YOUR_API_KEY`              |

## 请求参数

| 参数                   | 类型            | 必填 | 描述                                                                          |
| ---------------------- | --------------- | ---- | ----------------------------------------------------------------------------- |
| `model`                | string          | 是   | 模型名称。请使用 `agnes-2.0-flash`                                            |
| `messages`             | array           | 是   | 对话消息数组，包含 system、user 和 assistant 消息                             |
| `messages[].content`   | string / array  | 是   | 消息内容。可以是纯文本字符串，也可以是包含 `text` 和 `image_url` 内容块的数组 |
| `temperature`          | number          | 否   | 控制输出的随机性。较低的值会产生更确定性的结果                                |
| `top_p`                | number          | 否   | 控制核采样（nucleus sampling）。较低的值使输出更集中                          |
| `max_tokens`           | number          | 否   | 响应中生成的最大 token 数                                                     |
| `stream`               | boolean         | 否   | 是否启用流式输出                                                              |
| `tools`                | array           | 否   | 用于工具调用（tool-calling）工作流的工具定义                                  |
| `tool_choice`          | string / object | 否   | 控制模型是否以及如何使用工具                                                  |
| `chat_template_kwargs` | object          | 否   | 用于在 OpenAI 兼容请求中启用思考（Thinking）等能力的扩展字段                  |
| `thinking`             | object          | 否   | 用于在 Anthropic 兼容请求中启用思考模式的字段                                 |

## 图像 URL 输入支持

Agnes-2.0-Flash 支持通过图像 URL 进行图像输入。开发者可以在同一个 `messages` 请求中同时传递文本指令和图像 URL，使模型能够理解、分析图像内容或从中提取信息。

支持的输入类型：

| 输入类型 | 格式        | 描述                                  |
| -------- | ----------- | ------------------------------------- |
| 文本     | `text`      | 纯文本指令或问题                      |
| 图像 URL | `image_url` | 通过公开可访问的图像 URL 传递图像内容 |

### 图像内容结构

使用图像 URL 输入时，`messages[].content` 应使用数组结构。每个内容块代表一种输入类型。

```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "描述这张图片的内容。"
    },
    {
      "type": "image_url",
      "image_url": {
        "url": "https://example.com/image.jpg"
      }
    }
  ]
}
```

## 请求示例

### 1. 基础对话补全请求

使用此请求生成标准的对话补全响应。

```bash
curl https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-2.0-flash",
    "messages": [
      {
        "role": "system",
        "content": "你是一个有用的 AI 助手。"
      },
      {
        "role": "user",
        "content": "解释自主智能体如何使用工具来完成任务。"
      }
    ],
    "temperature": 0.7,
    "max_tokens": 1024
  }'
```

### 2. 流式输出请求

使用此请求启用流式输出。

```bash
curl https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-2.0-flash",
    "messages": [
      {
        "role": "user",
        "content": "为一款 AI 助手应用写一段简短的产品介绍。"
      }
    ],
    "stream": true
  }'
```

### 3. 工具调用请求

使用此请求进行需要调用外部工具的 Agent 工作流。

```bash
curl https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-2.0-flash",
    "messages": [
      {
        "role": "user",
        "content": "新加坡今天的天气怎么样？"
      }
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_weather",
          "description": "获取指定位置的当前天气",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "城市和所属国家"
              }
            },
            "required": ["location"]
          }
        }
      }
    ]
  }'
```

### 4. 图像 URL 输入请求

使用此请求通过图像 URL 传递图像，让模型理解或分析图像内容。

```bash
curl https://apihub.agnes-ai.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "agnes-2.0-flash",
    "messages": [
      {
        "role": "user",
        "content": [
          {
            "type": "text",
            "text": "描述这张图片的内容。"
          },
          {
            "type": "image_url",
            "image_url": {
              "url": "https://example.com/image.jpg"
            }
          }
        ]
      }
    ]
  }'
```

## 响应格式

```json
{
  "id": "chatcmpl_xxx",
  "object": "chat.completion",
  "created": 1774432125,
  "model": "agnes-2.0-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "自主智能体通过理解用户的目标，将其分解为多个步骤，选择合适的工具，执行操作，并利用结果来完成任务。"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 35,
    "completion_tokens": 58,
    "total_tokens": 93
  }
}
```

## 响应字段

| 字段                        | 类型    | 描述                               |
| --------------------------- | ------- | ---------------------------------- |
| `id`                        | string  | 补全请求的唯一 ID                  |
| `object`                    | string  | 对象类型，通常为 `chat.completion` |
| `created`                   | integer | 请求的时间戳                       |
| `model`                     | string  | 用于请求的模型                     |
| `choices`                   | array   | 生成的响应结果列表                 |
| `choices[].index`           | integer | 响应结果的索引                     |
| `choices[].message`         | object  | 助手消息对象                       |
| `choices[].message.role`    | string  | 消息发送者的角色                   |
| `choices[].message.content` | string  | 模型生成的响应内容                 |
| `choices[].finish_reason`   | string  | 生成停止的原因                     |
| `usage`                     | object  | Token 使用情况信息                 |
| `usage.prompt_tokens`       | integer | 输入 token 数量                    |
| `usage.completion_tokens`   | integer | 输出 token 数量                    |
| `usage.total_tokens`        | integer | 使用的 token 总数                  |
