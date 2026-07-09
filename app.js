/* ============================================================
   牛奶抗生素检测 — 应用主控制器（app.js）
   ------------------------------------------------------------
   状态机：INIT → IMAGE_LOADED → ANALYZING → RESULT
   协调：CameraModule / ColorAnalyzer / AntibioticDB
   ============================================================ */

(function () {
    'use strict';

    // ---------- DOM 引用 ----------
    var els = {};
    function $(id) { return document.getElementById(id); }

    var State = {
        INIT: 'INIT',
        IMAGE_LOADED: 'IMAGE_LOADED',
        ANALYZING: 'ANALYZING',
        RESULT: 'RESULT'
    };
    var currentState = State.INIT;

    // ---------- 初始化 ----------
    function init() {
        cacheEls();
        bindEvents();
        ColorAnalyzer.init(els.capturedImage, els.detectionCanvas);
        setupInstallPrompt();
    }

    function cacheEls() {
        els.capturePlaceholder = $('capturePlaceholder');
        els.capturePreview = $('capturePreview');
        els.capturedImage = $('capturedImage');
        els.detectionCanvas = $('detectionCanvas');
        els.captureCard = $('captureCard');
        els.selectHint = $('selectHint');
        els.gridOverlay = document.querySelector('.capture-grid-overlay');
        els.btnCapture = $('btnCapture');
        els.btnGallery = $('btnGallery');
        els.fileInput = $('fileInput');
        els.cameraVideo = $('cameraVideo');
        els.resultSection = $('resultSection');
        els.resultCard = $('resultCard');
        els.resultName = $('resultName');
        els.resultConfidence = $('resultConfidence');
        els.resultConcentration = $('resultConcentration');
        els.resultThreshold = $('resultThreshold');
        els.resultVerdict = $('resultVerdict');
        els.resultStatusGood = $('resultStatusGood');
        els.resultStatusWarn = $('resultStatusWarn');
        els.detectedSwatch = $('detectedSwatch');
        els.referenceSwatch = $('referenceSwatch');
        els.btnRetake = $('btnRetake');
        els.btnSave = $('btnSave');
        els.toast = $('toast');
        els.toastMessage = $('toastMessage');
    }

    // ---------- 事件绑定 ----------
    function bindEvents() {
        els.btnCapture.addEventListener('click', onCaptureClick);
        els.btnGallery.addEventListener('click', function () {
            els.fileInput.click();
        });
        els.fileInput.addEventListener('change', onFileSelected);
        els.btnRetake.addEventListener('click', resetToInit);
        els.btnSave.addEventListener('click', saveResult);
        els.detectionCanvas.addEventListener('click', onCanvasClick);
    }

    // ---------- 拍照 ----------
    function onCaptureClick() {
        if (!CameraModule.isSupported()) {
            // 不支持相机，直接走相册
            showToast('当前环境不支持相机，已切换为相册选择');
            els.fileInput.click();
            return;
        }
        openCameraOverlay();
    }

    function openCameraOverlay() {
        // 创建取景浮层
        var overlay = document.createElement('div');
        overlay.className = 'camera-overlay';
        overlay.innerHTML =
            '<video autoplay playsinline></video>' +
            '<div class="camera-overlay-frame"></div>' +
            '<div class="camera-overlay-actions">' +
            '  <button class="camera-cancel" data-act="cancel">取消</button>' +
            '  <button class="camera-shutter" data-act="shoot"></button>' +
            '</div>';
        document.body.appendChild(overlay);
        var video = overlay.querySelector('video');

        CameraModule.openCamera(video).then(function () {
            overlay.querySelector('[data-act="shoot"]').addEventListener('click', function () {
                try {
                    var dataUrl = CameraModule.captureFrame();
                    CameraModule.stopCamera();
                    overlay.remove();
                    loadImageFromDataURL(dataUrl);
                } catch (e) {
                    showToast('拍照失败，请重试');
                }
            });
            overlay.querySelector('[data-act="cancel"]').addEventListener('click', function () {
                CameraModule.stopCamera();
                overlay.remove();
            });
        }).catch(function (err) {
            overlay.remove();
            if (err && err.message === 'NOT_SUPPORTED') {
                showToast('不支持相机，已切换为相册');
                els.fileInput.click();
            } else {
                showToast('相机不可用，请使用相册选择图片');
                els.fileInput.click();
            }
        });
    }

    // ---------- 文件选择 ----------
    function onFileSelected(e) {
        var file = e.target.files && e.target.files[0];
        if (!file) return;
        CameraModule.readFileAsDataURL(file).then(function (dataUrl) {
            loadImageFromDataURL(dataUrl);
        }).catch(function () {
            showToast('图片读取失败');
        });
        // 允许再次选择同一文件
        e.target.value = '';
    }

    // ---------- 加载图片到预览 ----------
    function loadImageFromDataURL(dataUrl) {
        els.capturedImage.onload = function () {
            els.capturePlaceholder.style.display = 'none';
            els.capturePreview.style.display = 'block';
            // 等布局完成再绘制 canvas
            requestAnimationFrame(function () {
                var ok = ColorAnalyzer.drawImage();
                if (!ok) {
                    showToast('图片加载失败');
                    return;
                }
                els.gridOverlay.classList.add('show');
                els.selectHint.style.display = 'flex';
                setState(State.IMAGE_LOADED);
            });
        };
        els.capturedImage.src = dataUrl;
    }

    // ---------- 点击画布选取检测区域 ----------
    var lastTap = 0;
    function onCanvasClick(e) {
        if (currentState !== State.IMAGE_LOADED) return;
        // 防抖 200ms
        var now = Date.now();
        if (now - lastTap < 200) return;
        lastTap = now;

        var clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0].clientX);
        var clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0].clientY);
        if (clientX == null) return;

        // 涟漪动效
        spawnRipple(clientX, clientY);

        setState(State.ANALYZING);
        var result = ColorAnalyzer.analyzeAt(clientX, clientY, 5);
        if (!result) {
            showToast('颜色读取失败，请重试');
            setState(State.IMAGE_LOADED);
            return;
        }
        showRegionMarker(clientX, clientY);
        renderResult(result);
    }

    function spawnRipple(clientX, clientY) {
        var rect = els.detectionCanvas.getBoundingClientRect();
        var ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = (clientX - rect.left) + 'px';
        ripple.style.top = (clientY - rect.top) + 'px';
        els.captureCard.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 850);
    }

    function showRegionMarker(clientX, clientY) {
        var rect = els.detectionCanvas.getBoundingClientRect();
        var old = els.captureCard.querySelector('.region-marker');
        if (old) old.remove();
        var marker = document.createElement('div');
        marker.className = 'region-marker';
        marker.style.left = (clientX - rect.left) + 'px';
        marker.style.top = (clientY - rect.top) + 'px';
        els.captureCard.appendChild(marker);
    }

    // ---------- 渲染结果 ----------
    function renderResult(result) {
        var evaluation = AntibioticDB.evaluate(result);
        els.selectHint.style.display = 'none';

        if (!result.matched) {
            // 未匹配
            els.resultStatusGood.style.display = 'none';
            els.resultStatusWarn.style.display = 'inline-flex';
            els.resultName.textContent = '未能匹配';
            els.resultConfidence.textContent = '与标准色卡差异过大（Δ=' + Math.round(result.distance) + '）';
            els.resultConcentration.textContent = '--';
            els.resultThreshold.textContent = '--';
            els.resultVerdict.textContent = '--';
            els.resultVerdict.className = 'info-value';
            els.detectedSwatch.style.background = rgbToCss(result.rgb);
            els.referenceSwatch.style.background = 'transparent';
        } else {
            els.resultStatusGood.style.display = 'inline-flex';
            els.resultStatusWarn.style.display = 'none';
            els.resultName.textContent = result.antibiotic.name +
                '（' + result.antibiotic.category + '）';
            els.resultConfidence.textContent = '匹配置信度 ' + result.confidence + '%';

            els.resultConcentration.textContent = result.scale.label;
            els.resultThreshold.textContent = result.antibiotic.threshold;

            els.resultVerdict.textContent = evaluation.text;
            els.resultVerdict.className = 'info-value ' + (evaluation.danger ? 'danger' : 'ok');

            els.detectedSwatch.style.background = rgbToCss(result.rgb);
            els.referenceSwatch.style.background = rgbToCss(result.scale.rgb);
        }

        // 重新触发色块动画
        [els.detectedSwatch, els.referenceSwatch].forEach(function (el) {
            el.style.animation = 'none';
            void el.offsetWidth;
            el.style.animation = '';
        });

        els.resultSection.style.display = 'flex';
        setState(State.RESULT);
        els.resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---------- 保存结果 ----------
    function saveResult() {
        var record = {
            time: new Date().toLocaleString('zh-CN'),
            name: els.resultName.textContent,
            concentration: els.resultConcentration.textContent,
            verdict: els.resultVerdict.textContent
        };
        try {
            var key = 'antibiotic_records';
            var list = JSON.parse(localStorage.getItem(key) || '[]');
            list.unshift(record);
            if (list.length > 50) list = list.slice(0, 50);
            localStorage.setItem(key, JSON.stringify(list));
            showToast('结果已保存 ✓');
        } catch (e) {
            showToast('保存失败');
        }
    }

    // ---------- 重置 ----------
    function resetToInit() {
        ColorAnalyzer.reset();
        els.capturePreview.style.display = 'none';
        els.capturePlaceholder.style.display = 'flex';
        els.gridOverlay.classList.remove('show');
        els.selectHint.style.display = 'none';
        els.resultSection.style.display = 'none';
        var marker = els.captureCard.querySelector('.region-marker');
        if (marker) marker.remove();
        setState(State.INIT);
    }

    // ---------- 状态机 ----------
    function setState(s) {
        currentState = s;
    }

    // ---------- 工具 ----------
    function rgbToCss(rgb) {
        return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
    }

    var toastTimer = null;
    function showToast(msg) {
        els.toastMessage.textContent = msg;
        els.toast.style.display = 'block';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            els.toast.style.display = 'none';
        }, 2200);
    }

    // ---------- PWA 安装提示 ----------
    var deferredPrompt = null;
    function setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', function (e) {
            e.preventDefault();
            deferredPrompt = e;
            showInstallBanner();
        });
    }

    function showInstallBanner() {
        if (document.querySelector('.install-banner')) return;
        if (window.matchMedia('(display-mode: standalone)').matches) return;
        var banner = document.createElement('div');
        banner.className = 'install-banner';
        banner.innerHTML =
            '<span class="install-banner-text">📲 可添加到主屏幕，像APP一样使用</span>' +
            '<button data-act="install">添加</button>' +
            '<button class="install-banner-close" data-act="close">×</button>';
        document.body.appendChild(banner);
        banner.querySelector('[data-act="install"]').addEventListener('click', function () {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(function () {
                    deferredPrompt = null;
                    banner.remove();
                });
            }
        });
        banner.querySelector('[data-act="close"]').addEventListener('click', function () {
            banner.remove();
        });
    }

    // ---------- 启动 ----------
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
