// lib/gen.js

import * as PImage from 'pureimage';
import fs from 'fs/promises';
import fsSync from 'fs';
import { PassThrough } from 'stream';

// ===================================================================
// Part 1: 依赖和辅助函数 (代码保持不变)
// ===================================================================

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (error) => reject(error));
    });
}

async function downloadAsset(url, destPath) {
    if (fsSync.existsSync(destPath)) {
        console.log(`资源已存在于缓存中: ${destPath}`);
        return;
    }
    console.log(`正在从 ${url} 下载...`);
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`下载失败: ${res.status} ${res.statusText}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(destPath, buffer);
    console.log(`资源已保存至: ${destPath}`);
}


// ===================================================================
// Part 2: 核心图片生成函数 (应用了 Math.ceil 修复)
// ===================================================================

async function generateNameImage({ lastName, firstName, lastNameFirstCharColor }, bgPath, fontPath) {
    const CONFIG = {
        startPos: { x: 84, yLarge: 194, ySmall: 202 },
        spacings: {
            lastNameLargeToSmall: 70,
            lastNameSmallToSmall: 0,
            betweenNames: 0,
            firstNameLargeToSmall: 70,
            firstNameSmallToSmall: 0,
        },
        fontSizes: { large: '136pt', small: '72pt' },
        fontFamily: 'MyFont',
        colors: { default: '#FFFFFF' },
        endPadding: 0,
        minWidth: 310,
    };

    try {
        const font = PImage.registerFont(fontPath, CONFIG.fontFamily);
        await font.load();
        const bgImg = await PImage.decodePNGFromStream(fsSync.createReadStream(bgPath));

        const tempCanvas = PImage.make(1, 1);
        const tempCtx = tempCanvas.getContext('2d');
        let totalTextWidth = 0;
        
        // --- 宽度计算部分 ---
        if (lastName) {
            tempCtx.font = `${CONFIG.fontSizes.large} ${CONFIG.fontFamily}`;
            // 修改点 1: 向上取整
            totalTextWidth += Math.ceil(tempCtx.measureText(lastName.substring(0, 1)).width);
            if (lastName.length > 1) {
                totalTextWidth += CONFIG.spacings.lastNameLargeToSmall;
                tempCtx.font = `${CONFIG.fontSizes.small} ${CONFIG.fontFamily}`;
                for (let i = 1; i < lastName.length; i++) {
                    // 修改点 2: 向上取整
                    totalTextWidth += Math.ceil(tempCtx.measureText(lastName[i]).width);
                    if (i < lastName.length - 1) totalTextWidth += CONFIG.spacings.lastNameSmallToSmall;
                }
            }
        }
        if (lastName && firstName) totalTextWidth += CONFIG.spacings.betweenNames;
        if (firstName) {
            tempCtx.font = `${CONFIG.fontSizes.large} ${CONFIG.fontFamily}`;
            // 修改点 3: 向上取整
            totalTextWidth += Math.ceil(tempCtx.measureText(firstName.substring(0, 1)).width);
            if (firstName.length > 1) {
                totalTextWidth += CONFIG.spacings.firstNameLargeToSmall;
                tempCtx.font = `${CONFIG.fontSizes.small} ${CONFIG.fontFamily}`;
                for (let i = 1; i < firstName.length; i++) {
                    // 修改点 4: 向上取整
                    totalTextWidth += Math.ceil(tempCtx.measureText(firstName[i]).width);
                    if (i < firstName.length - 1) totalTextWidth += CONFIG.spacings.firstNameSmallToSmall;
                }
            }
        }

        const contentWidth = CONFIG.startPos.x + totalTextWidth + CONFIG.endPadding;
        const finalWidth = Math.max(CONFIG.minWidth, contentWidth);
        const finalHeight = bgImg.height;

        const finalCanvas = PImage.make(finalWidth, finalHeight);
        const ctx = finalCanvas.getContext('2d');
        ctx.clearRect(0, 0, finalWidth, finalHeight);
        ctx.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);
        
        let currentX = CONFIG.startPos.x;

        // --- 文本绘制部分 ---
        if (lastName) {
            const firstChar = lastName.substring(0, 1);
            const restChars = lastName.substring(1);
            ctx.fillStyle = lastNameFirstCharColor || CONFIG.colors.default;
            ctx.font = `${CONFIG.fontSizes.large} ${CONFIG.fontFamily}`;
            ctx.fillText(firstChar, currentX, CONFIG.startPos.yLarge);
            // 修改点 5: 向上取整
            currentX += Math.ceil(tempCtx.measureText(firstChar).width);
            if (restChars) {
                currentX += CONFIG.spacings.lastNameLargeToSmall;
                ctx.fillStyle = CONFIG.colors.default;
                ctx.font = `${CONFIG.fontSizes.small} ${CONFIG.fontFamily}`;
                for (let i = 0; i < restChars.length; i++) {
                    const char = restChars[i];
                    ctx.fillText(char, currentX, CONFIG.startPos.ySmall);
                    // 修改点 6: 向上取整
                    currentX += Math.ceil(tempCtx.measureText(char).width);
                    if (i < restChars.length - 1) currentX += CONFIG.spacings.lastNameSmallToSmall;
                }
            }
        }
        if (lastName && firstName) currentX += CONFIG.spacings.betweenNames;
        if (firstName) {
            ctx.fillStyle = CONFIG.colors.default;
            const firstChar = firstName.substring(0, 1);
            const restChars = firstName.substring(1);
            ctx.font = `${CONFIG.fontSizes.large} ${CONFIG.fontFamily}`;
            ctx.fillText(firstChar, currentX, CONFIG.startPos.yLarge);
            // 修改点 7: 向上取整
            currentX += Math.ceil(tempCtx.measureText(firstChar).width);
            if (restChars) {
                currentX += CONFIG.spacings.firstNameLargeToSmall;
                ctx.font = `${CONFIG.fontSizes.small} ${CONFIG.fontFamily}`;
                for (let i = 0; i < restChars.length; i++) {
                    const char = restChars[i];
                    ctx.fillText(char, currentX, CONFIG.startPos.ySmall);
                    // 修改点 8: 向上取整
                    currentX += Math.ceil(tempCtx.measureText(char).width);
                    if (i < restChars.length - 1) currentX += CONFIG.spacings.firstNameSmallToSmall;
                }
            }
        }
        
        const bufferStream = new PassThrough();
        const bufferPromise = streamToBuffer(bufferStream);
        await PImage.encodePNGToStream(finalCanvas, bufferStream);
        return await bufferPromise;
    } catch (error) {
        console.error("生成图片时出错:", error);
        throw error;
    }
}

// 保持 ESM 导出方式
export {
    generateNameImage, downloadAsset
};