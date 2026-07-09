/* ============================================================
   牛奶抗生素检测 — 图像捕获模块（camera.js）
   ------------------------------------------------------------
   封装：
     - getUserMedia 调用后置摄像头实时取景
     - 拍照截取当前帧
     - 文件选择器（相册）回退方案
     - 权限拒绝 / 不支持环境下的优雅降级
   ============================================================ */

(function (global) {
    'use strict';

    var stream = null;          // 当前媒体流
    var videoEl = null;         // <video> 元素
    var overlayEl = null;       // 取景浮层 DOM

    /**
     * 浏览器是否支持相机 API
     */
    function isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    /**
     * 打开相机取景浮层
     * @param {HTMLVideoElement} video 视频元素
     * @returns {Promise} resolve 后相机就绪
     */
    function openCamera(video) {
        if (!isSupported()) {
            return Promise.reject(new Error('NOT_SUPPORTED'));
        }
        videoEl = video;
        var constraints = {
            audio: false,
            video: {
                facingMode: { ideal: 'environment' },
                width: { ideal: 1920 },
                height: { ideal: 1440 }
            }
        };
        return navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) {
                stream = mediaStream;
                videoEl.srcObject = stream;
                return new Promise(function (resolve) {
                    videoEl.onloadedmetadata = function () {
                        resolve();
                    };
                });
            });
    }

    /**
     * 从取景视频中截取一帧为图片
     * @returns {string} dataURL (image/jpeg)
     */
    function captureFrame() {
        if (!videoEl || !videoEl.videoWidth) {
            throw new Error('CAMERA_NOT_READY');
        }
        var canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.92);
    }

    /**
     * 停止相机并释放资源
     */
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(function (track) { track.stop(); });
            stream = null;
        }
        if (videoEl) {
            videoEl.srcObject = null;
        }
    }

    /**
     * 从 File 对象读取为 dataURL
     * @param {File} file
     * @returns {Promise<string>} dataURL
     */
    function readFileAsDataURL(file) {
        return new Promise(function (resolve, reject) {
            if (!file) { reject(new Error('NO_FILE')); return; }
            if (!/^image\//.test(file.type)) { reject(new Error('NOT_IMAGE')); return; }
            var reader = new FileReader();
            reader.onload = function (e) { resolve(e.target.result); };
            reader.onerror = function () { reject(new Error('READ_FAILED')); };
            reader.readAsDataURL(file);
        });
    }

    global.CameraModule = {
        isSupported: isSupported,
        openCamera: openCamera,
        captureFrame: captureFrame,
        stopCamera: stopCamera,
        readFileAsDataURL: readFileAsDataURL
    };

})(window);
