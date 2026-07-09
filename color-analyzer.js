/* ============================================================
   牛奶抗生素检测 — 颜色分析模块（color-analyzer.js）
   ------------------------------------------------------------
   职责：
     - 将图片绘制到 Canvas 用于像素级读取
     - 触摸坐标 → 原始图像像素坐标 映射
     - 5×5 邻域采样取平均 RGB（抗噪）
     - 调用 AntibioticDB.match 进行颜色匹配
   ============================================================ */

(function (global) {
    'use strict';

    var canvas = null;
    var ctx = null;
    var imgEl = null;
    var naturalW = 0;
    var naturalH = 0;
    var renderW = 0;  // canvas 实际显示宽度（CSS 像素）
    var renderH = 0;

    /**
     * 初始化，传入页面上的 <img> 与 <canvas>
     * @param {HTMLImageElement} img
     * @param {HTMLCanvasElement} cvs
     */
    function init(img, cvs) {
        imgEl = img;
        canvas = cvs;
        ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    /**
     * 将已加载的图片绘制到 canvas，并隐藏 <img>
     * @returns {boolean} 成功与否
     */
    function drawImage() {
        if (!imgEl || !imgEl.naturalWidth) return false;
        naturalW = imgEl.naturalWidth;
        naturalH = imgEl.naturalHeight;

        // canvas 像素尺寸 = 原始尺寸（保留精度）
        canvas.width = naturalW;
        canvas.height = naturalH;
        ctx.drawImage(imgEl, 0, 0, naturalW, naturalH);

        // 记录显示尺寸用于坐标换算
        var rect = canvas.getBoundingClientRect();
        renderW = rect.width;
        renderH = rect.height;
        return true;
    }

    /**
     * 将触摸/鼠标事件的客户端坐标转换为原始图像像素坐标
     * @param {number} clientX
     * @param {number} clientY
     * @returns {Object|null} { x, y } 原始像素坐标
     */
    function toImageCoords(clientX, clientY) {
        if (!renderW || !renderH) {
            var rect = canvas.getBoundingClientRect();
            renderW = rect.width;
            renderH = rect.height;
        }
        if (!renderW || !renderH) return null;
        var rect = canvas.getBoundingClientRect();
        var px = (clientX - rect.left) / renderW * naturalW;
        var py = (clientY - rect.top) / renderH * naturalH;
        px = Math.max(0, Math.min(naturalW - 1, Math.round(px)));
        py = Math.max(0, Math.min(naturalH - 1, Math.round(py)));
        return { x: px, y: py };
    }

    /**
     * 在 (x,y) 处取 5×5 邻域平均 RGB
     * @param {number} x 原始像素坐标
     * @param {number} y
     * @returns {Array|null} [r,g,b]
     */
    function sampleAverageRGB(x, y, size) {
        size = size || 5;
        if (!ctx) return null;
        var half = Math.floor(size / 2);
        var x0 = Math.max(0, x - half);
        var y0 = Math.max(0, y - half);
        var x1 = Math.min(naturalW - 1, x + half);
        var y1 = Math.min(naturalH - 1, y + half);
        var w = x1 - x0 + 1;
        var h = y1 - y0 + 1;
        if (w <= 0 || h <= 0) return null;

        var data;
        try {
            data = ctx.getImageData(x0, y0, w, h).data;
        } catch (e) {
            // 跨域图片可能触发安全限制
            return null;
        }
        var sumR = 0, sumG = 0, sumB = 0;
        var count = w * h;
        for (var i = 0; i < data.length; i += 4) {
            sumR += data[i];
            sumG += data[i + 1];
            sumB += data[i + 2];
        }
        return [
            Math.round(sumR / count),
            Math.round(sumG / count),
            Math.round(sumB / count)
        ];
    }

    /**
     * 完整流程：从坐标采样并匹配抗生素
     * @param {number} clientX
     * @param {number} clientY
     * @returns {Object|null} 匹配结果（含 rgb）
     */
    function analyzeAt(clientX, clientY, sampleSize) {
        var coords = toImageCoords(clientX, clientY);
        if (!coords) return null;
        var rgb = sampleAverageRGB(coords.x, coords.y, sampleSize);
        if (!rgb) return null;
        var matchResult = global.AntibioticDB.match(rgb);
        if (matchResult) matchResult.rgb = rgb;
        return matchResult;
    }

    /**
     * 卸下当前分析状态
     */
    function reset() {
        if (ctx && canvas) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        naturalW = naturalH = renderW = renderH = 0;
    }

    global.ColorAnalyzer = {
        init: init,
        drawImage: drawImage,
        toImageCoords: toImageCoords,
        sampleAverageRGB: sampleAverageRGB,
        analyzeAt: analyzeAt,
        reset: reset
    };

})(window);
