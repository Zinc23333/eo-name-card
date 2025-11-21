# 生成《魔法少女的魔女审判》样式的姓名卡片
本项目仿照 [《魔法少女的魔女审判》](https://store.steampowered.com/app/3101040) 中犯人名字的显示形式，生成姓名卡片。本项目部署在EdgeOne,利用其 Node Functions 能力，动态渲染生成。

![样例-樱羽艾玛](public/example.webp)

## 在线使用

[主页](https://card.manosaba.zinc233.top)

[测试页](https://card.manosaba.zinc233.top/test.html)
中包含游戏中各人物的名称卡片，由该程序实时生成。

可能有部分细节并不是很还原，请多多见谅。

## API

``` url
/api/generate?lastName=...&firstName=...&color=...
```

其中：
- `lastName` 姓（必填，如`樱羽`）
- `firstName` 名（必填，如`艾玛`）
- `color` 颜色（可选，如`fd91af`）