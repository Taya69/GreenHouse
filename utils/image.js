import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import sharp from 'sharp';

export async function resizeImageFromUrl(imageUrl, targetWidth = 320) {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
    const buffer = Buffer.from(await response.arrayBuffer());

    const resized = await sharp(buffer)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();

    const tmpDir = os.tmpdir();
    const filePath = path.join(tmpDir, `product_${Date.now()}.jpg`);
    await fs.promises.writeFile(filePath, resized);
    return filePath;
}

export async function safeUnlink(filePath) {
    try {
        await fs.promises.unlink(filePath);
    } catch (_) {}
}

export async function combineTwoImagesFromUrls(leftUrl, rightUrl, targetWidthEach = 320, gap = 10) {
    const [leftResp, rightResp] = await Promise.all([fetch(leftUrl), fetch(rightUrl)]);
    if (!leftResp.ok || !rightResp.ok) throw new Error('Failed to fetch one of the images');
    const [leftBuf, rightBuf] = await Promise.all([
        Buffer.from(await leftResp.arrayBuffer()),
        Buffer.from(await rightResp.arrayBuffer())
    ]);

    const [leftResized, rightResized] = await Promise.all([
        sharp(leftBuf).resize({ width: targetWidthEach, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer(),
        sharp(rightBuf).resize({ width: targetWidthEach, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer()
    ]);

    const [leftMeta, rightMeta] = await Promise.all([
        sharp(leftResized).metadata(),
        sharp(rightResized).metadata()
    ]);

    const height = Math.max(leftMeta.height || 0, rightMeta.height || 0);
    const width = (leftMeta.width || targetWidthEach) + gap + (rightMeta.width || targetWidthEach);

    const background = { r: 255, g: 255, b: 255, alpha: 1 };
    const composite = await sharp({ create: { width, height, channels: 3, background } })
        .composite([
            { input: leftResized, left: 0, top: 0 },
            { input: rightResized, left: (leftMeta.width || targetWidthEach) + gap, top: 0 }
        ])
        .jpeg({ quality: 80 })
        .toBuffer();

    const filePath = path.join(os.tmpdir(), `products_pair_${Date.now()}.jpg`);
    await fs.promises.writeFile(filePath, composite);
    return filePath;
}


