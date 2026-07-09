/* ============================================================
   牛奶抗生素检测 — β-内酰胺类抗生素颜色对照数据库
   ------------------------------------------------------------
   说明：本数据库为「演示/标定模板」。比色试纸的真实 RGB 值
   需使用标准浓度样本 + 比色卡实际标定后替换 rgb 字段。
   每个抗生素条目包含一组浓度梯度（colorScale），匹配时取
   距离最近的梯度作为结果。
   ============================================================ */

(function (global) {
    'use strict';

    /**
     * 抗生素数据条目结构：
     * {
     *   id:        唯一标识
     *   name:      抗生素中文名
     *   category:  类别（青霉素类 / 头孢菌素类 / 碳青霉烯类）
     *   threshold: 安全阈值文字（如 "≤ 4 μg/kg"）
     *   thresholdValue: 用于判定的浓度数值（μg/kg），0 表示阴性
     *   colorScale: [
     *     { concentration: 数值, unit: 'μg/kg', label: '文字', rgb: [R,G,B] }
     *   ]
     * }
     */

    var ANTIBIOTICS = [
        // ---------- 青霉素类 ----------
        {
            id: 'ampicillin',
            name: '氨苄西林',
            category: '青霉素类',
            threshold: '≤ 4 μg/kg',
            thresholdValue: 4,
            colorScale: [
                { concentration: 0,    unit: 'μg/kg', label: '阴性（未检出）', rgb: [232, 240, 250] },
                { concentration: 4,    unit: 'μg/kg', label: '4 μg/kg',        rgb: [205, 224, 245] },
                { concentration: 8,    unit: 'μg/kg', label: '8 μg/kg',        rgb: [170, 205, 235] },
                { concentration: 16,   unit: 'μg/kg', label: '16 μg/kg',       rgb: [120, 180, 220] },
                { concentration: 32,   unit: 'μg/kg', label: '32 μg/kg',       rgb: [70, 150, 200] }
            ]
        },
        {
            id: 'amoxicillin',
            name: '阿莫西林',
            category: '青霉素类',
            threshold: '≤ 4 μg/kg',
            thresholdValue: 4,
            colorScale: [
                { concentration: 0,    unit: 'μg/kg', label: '阴性（未检出）', rgb: [235, 242, 248] },
                { concentration: 4,    unit: 'μg/kg', label: '4 μg/kg',        rgb: [212, 228, 244] },
                { concentration: 8,    unit: 'μg/kg', label: '8 μg/kg',        rgb: [180, 212, 236] },
                { concentration: 16,   unit: 'μg/kg', label: '16 μg/kg',       rgb: [130, 188, 222] },
                { concentration: 32,   unit: 'μg/kg', label: '32 μg/kg',       rgb: [82, 158, 205] }
            ]
        },
        {
            id: 'penicillinG',
            name: '青霉素 G',
            category: '青霉素类',
            threshold: '≤ 4 μg/kg',
            thresholdValue: 4,
            colorScale: [
                { concentration: 0,    unit: 'μg/kg', label: '阴性（未检出）', rgb: [238, 238, 246] },
                { concentration: 4,    unit: 'μg/kg', label: '4 μg/kg',        rgb: [218, 220, 240] },
                { concentration: 8,    unit: 'μg/kg', label: '8 μg/kg',        rgb: [192, 198, 232] },
                { concentration: 16,   unit: 'μg/kg', label: '16 μg/kg',       rgb: [158, 168, 220] },
                { concentration: 32,   unit: 'μg/kg', label: '32 μg/kg',       rgb: [120, 135, 205] }
            ]
        },
        // ---------- 头孢菌素类 ----------
        {
            id: 'cefalexin',
            name: '头孢氨苄',
            category: '头孢菌素类',
            threshold: '≤ 100 μg/kg',
            thresholdValue: 100,
            colorScale: [
                { concentration: 0,    unit: 'μg/kg', label: '阴性（未检出）', rgb: [240, 245, 235] },
                { concentration: 50,   unit: 'μg/kg', label: '50 μg/kg',       rgb: [222, 238, 208] },
                { concentration: 100,  unit: 'μg/kg', label: '100 μg/kg',      rgb: [198, 228, 175] },
                { concentration: 200,  unit: 'μg/kg', label: '200 μg/kg',      rgb: [162, 212, 130] },
                { concentration: 400,  unit: 'μg/kg', label: '400 μg/kg',      rgb: [120, 195, 82] }
            ]
        },
        {
            id: 'cefotaxime',
            name: '头孢噻肟',
            category: '头孢菌素类',
            threshold: '≤ 50 μg/kg',
            thresholdValue: 50,
            colorScale: [
                { concentration: 0,    unit: 'μg/kg', label: '阴性（未检出）', rgb: [245, 240, 232] },
                { concentration: 25,   unit: 'μg/kg', label: '25 μg/kg',       rgb: [236, 222, 198] },
                { concentration: 50,   unit: 'μg/kg', label: '50 μg/kg',       rgb: [228, 200, 160] },
                { concentration: 100,  unit: 'μg/kg', label: '100 μg/kg',      rgb: [218, 174, 120] },
                { concentration: 200,  unit: 'μg/kg', label: '200 μg/kg',      rgb: [205, 145, 80] }
            ]
        },
        // ---------- 碳青霉烯类 ----------
        {
            id: 'meropenem',
            name: '美罗培南',
            category: '碳青霉烯类',
            threshold: '≤ 50 μg/kg',
            thresholdValue: 50,
            colorScale: [
                { concentration: 0,    unit: 'μg/kg', label: '阴性（未检出）', rgb: [242, 233, 240] },
                { concentration: 25,   unit: 'μg/kg', label: '25 μg/kg',       rgb: [230, 210, 228] },
                { concentration: 50,   unit: 'μg/kg', label: '50 μg/kg',       rgb: [216, 184, 214] },
                { concentration: 100,  unit: 'μg/kg', label: '100 μg/kg',      rgb: [200, 154, 200] },
                { concentration: 200,  unit: 'μg/kg', label: '200 μg/kg',      rgb: [182, 120, 186] }
            ]
        }
    ];

    /**
     * 匹配阈值：RGB 欧氏距离超过该值视为未能匹配
     */
    var MATCH_THRESHOLD = 55;

    /**
     * 获取全部抗生素列表
     */
    function getAll() {
        return ANTIBIOTICS;
    }

    /**
     * 根据 id 获取抗生素
     */
    function getById(id) {
        for (var i = 0; i < ANTIBIOTICS.length; i++) {
            if (ANTIBIOTICS[i].id === id) return ANTIBIOTICS[i];
        }
        return null;
    }

    /**
     * 计算两个 RGB 数组的欧氏距离
     */
    function rgbDistance(a, b) {
        var dr = a[0] - b[0];
        var dg = a[1] - b[1];
        var db = a[2] - b[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    /**
     * 在单个抗生素的 colorScale 中查找最匹配的梯度
     * @returns {Object|null} { concentration, unit, label, rgb, distance }
     */
    function matchScale(antibiotic, rgb) {
        var best = null;
        for (var i = 0; i < antibiotic.colorScale.length; i++) {
            var scale = antibiotic.colorScale[i];
            var dist = rgbDistance(rgb, scale.rgb);
            if (!best || dist < best.distance) {
                best = {
                    concentration: scale.concentration,
                    unit: scale.unit,
                    label: scale.label,
                    rgb: scale.rgb,
                    distance: dist
                };
            }
        }
        return best;
    }

    /**
     * 全局匹配：在所有抗生素的所有梯度中找最近色
     * @param {Array} rgb 如 [R,G,B]
     * @returns {Object|null}
     *   {
     *     antibiotic,          // 抗生素对象
     *     scale,               // 匹配到的梯度对象
     *     distance,            // 与参考色的距离
     *     confidence,          // 置信度百分比 0-100
     *     matched: boolean     // 是否在阈值内
     *   }
     */
    function match(rgb) {
        var globalBest = null;
        for (var i = 0; i < ANTIBIOTICS.length; i++) {
            var ab = ANTIBIOTICS[i];
            var scaleMatch = matchScale(ab, rgb);
            if (!scaleMatch) continue;
            if (!globalBest || scaleMatch.distance < globalBest.distance) {
                globalBest = {
                    antibiotic: ab,
                    scale: scaleMatch,
                    distance: scaleMatch.distance,
                    matched: scaleMatch.distance <= MATCH_THRESHOLD
                };
            }
        }
        if (!globalBest) return null;

        // 置信度：距离 0 时 100%，距离达到阈值时约 50%
        var confidence = Math.max(0, 100 - (globalBest.distance / MATCH_THRESHOLD) * 50);
        globalBest.confidence = Math.round(confidence);
        return globalBest;
    }

    /**
     * 根据抗生素的阈值判定结果是否超标
     * @param {Object} matchResult match() 的返回值
     * @returns {Object} { verdict: 'safe'|'exceed'|'unknown', text, danger: boolean }
     */
    function evaluate(matchResult) {
        if (!matchResult || !matchResult.matched) {
            return { verdict: 'unknown', text: '无法判定', danger: false };
        }
        var ab = matchResult.antibiotic;
        var conc = matchResult.scale.concentration;
        if (conc <= 0) {
            return { verdict: 'safe', text: '未检出 / 合格', danger: false };
        }
        if (conc > ab.thresholdValue) {
            return { verdict: 'exceed', text: '超标！', danger: true };
        }
        return { verdict: 'safe', text: '合格', danger: false };
    }

    // 导出
    global.AntibioticDB = {
        getAll: getAll,
        getById: getById,
        match: match,
        evaluate: evaluate,
        rgbDistance: rgbDistance,
        MATCH_THRESHOLD: MATCH_THRESHOLD
    };

})(window);
