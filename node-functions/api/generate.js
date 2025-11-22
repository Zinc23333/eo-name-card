import { generateNameImage, downloadAsset } from 'lib/gen.js';

/**
 * @param {{ request: Request }} param0 - 传入的请求对象
 */
export default async function onRequest({ request }) {
    try {
        // 1. 解析 URL 查询参数
        const url = new URL(request.url);
        const params = url.searchParams;

        const lastName = params.get('lastName') || '';
        const firstName = params.get('firstName') || '';
        const colorHex = params.get('color'); // e.g., 'FFD700'

        // 格式化颜色参数，如果存在则加上 '#'
        const lastNameFirstCharColor = colorHex ? `#${colorHex}` : null;

        // 2. 准备资源 (下载到 /tmp 目录)
        const bgUrl = `/public/bg.png`;
        const fontUrl = `/public/DreamHanSerifCN-W10.ttf`;
        
        const tmpBgPath = '/tmp/bg.png';
        const tmpFontPath = '/tmp/ft.ttf';

        // 并行下载资源以提高速度
        await Promise.all([
            downloadAsset(bgUrl, tmpBgPath),
            downloadAsset(fontUrl, tmpFontPath)
        ]);

        // 3. 调用核心函数生成图片 Buffer
        const imageBuffer = await generateNameImage(
            { lastName, firstName, lastNameFirstCharColor },
            tmpBgPath,
            tmpFontPath
        );

        // 4. 返回成功的图片响应
        return new Response(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'image/png',
                // 建议添加缓存头，避免对相同URL的重复计算
                'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            },
        });

    } catch (error) {
        // 5. 如果过程中出现任何错误，返回一个错误响应
        console.error('在 onRequest 函数中捕获到错误:', error);
        return new Response(`图片生成失败: ${error.message}`, {
            status: 500,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }
}