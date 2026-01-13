// utils/util.js

/**
 * 格式化日期
 * @param {Date|string|number} date 日期
 * @param {string} format 格式模板
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date);

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  const second = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hour)
    .replace('mm', minute)
    .replace('ss', second);
}

/**
 * 格式化相对时间（多久前）
 * @param {Date|string|number} date 日期
 * @returns {string} 相对时间字符串
 */
function formatRelativeTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`;
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`;
  } else {
    return `${Math.floor(diff / year)}年前`;
  }
}

/**
 * 格式化价格
 * @param {number} price 价格
 * @param {string} symbol 货币符号
 * @returns {string} 格式化后的价格
 */
function formatPrice(price, symbol = '¥') {
  if (typeof price !== 'number') {
    price = parseFloat(price);
  }

  if (isNaN(price)) {
    return `${symbol}0.00`;
  }

  return `${symbol}${price.toFixed(2)}`;
}

/**
 * 格式化数字（添加千分位）
 * @param {number} num 数字
 * @returns {string} 格式化后的数字
 */
function formatNumber(num) {
  if (typeof num !== 'number') {
    num = parseFloat(num);
  }

  if (isNaN(num)) {
    return '0';
  }

  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 验证手机号
 * @param {string} phone 手机号
 * @returns {boolean} 是否有效
 */
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 验证身份证号
 * @param {string} idCard 身份证号
 * @returns {boolean} 是否有效
 */
function isValidIdCard(idCard) {
  return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
}

/**
 * 验证邮箱
 * @param {string} email 邮箱
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 验证URL
 * @param {string} url URL
 * @returns {boolean} 是否有效
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 节流后的函数
 */
function throttle(fn, delay = 300) {
  let timer = null;
  let lastTime = 0;

  return function (...args) {
    const now = Date.now();

    if (now - lastTime >= delay) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(this, args);
      }, delay - (now - lastTime));
    }
  };
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {number} delay 延迟时间
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay = 300) {
  let timer = null;

  return function (...args) {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

/**
 * 深拷贝
 * @param {*} obj 要拷贝的对象
 * @returns {*} 拷贝后的对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }

  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function randomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * 获取URL参数
 * @param {string} url URL字符串
 * @returns {Object} 参数对象
 */
function getUrlParams(url) {
  const params = {};
  const queryString = url.split('?')[1];

  if (!queryString) {
    return params;
  }

  queryString.split('&').forEach(param => {
    const [key, value] = param.split('=');
    params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });

  return params;
}

/**
 * 对象转URL参数
 * @param {Object} obj 对象
 * @returns {string} URL参数字符串
 */
function objectToUrlParams(obj) {
  return Object.keys(obj)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

/**
 * 获取图片临时路径（用于选择图片后上传）
 * @param {string} filePath 文件路径
 * @returns {string} 临时路径
 */
function getTempImagePath(filePath) {
  return filePath;
}

/**
 * 压缩图片
 * @param {string} filePath 图片路径
 * @param {number} quality 压缩质量 0-100
 * @returns {Promise<string>} 压缩后的图片路径
 */
function compressImage(filePath, quality = 80) {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src: filePath,
      quality,
      success: (res) => {
        resolve(res.tempFilePath);
      },
      fail: reject
    });
  });
}

/**
 * 选择图片
 * @param {Object} options 选项
 * @returns {Promise<Array>} 图片路径数组
 */
function chooseImage(options = {}) {
  const defaultOptions = {
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera']
  };

  return new Promise((resolve, reject) => {
    wx.chooseImage({
      ...defaultOptions,
      ...options,
      success: (res) => {
        resolve(res.tempFilePaths);
      },
      fail: reject
    });
  });
}

/**
 * 预览图片
 * @param {string} current 当前图片路径
 * @param {Array} urls 图片路径数组
 */
function previewImage(current, urls) {
  wx.previewImage({
    current,
    urls: urls || [current]
  });
}

/**
 * 保存图片到相册
 * @param {string} filePath 图片路径
 * @returns {Promise<boolean>} 是否成功
 */
function saveImageToPhotosAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        wx.showToast({
          title: '已保存到相册',
          icon: 'success'
        });
        resolve(true);
      },
      fail: (err) => {
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '提示',
            content: '需要您授权保存相册',
            showCancel: false
          });
        }
        reject(err);
      }
    });
  });
}

/**
 * 复制到剪贴板
 * @param {string} data 要复制的数据
 * @returns {Promise<boolean>} 是否成功
 */
function setClipboardData(data) {
  return new Promise((resolve, reject) => {
    wx.setClipboardData({
      data,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
        resolve(true);
      },
      fail: reject
    });
  });
}

/**
 * 获取系统信息
 * @returns {Object} 系统信息
 */
function getSystemInfo() {
  try {
    return wx.getSystemInfoSync();
  } catch (e) {
    return {};
  }
}

/**
 * 判断是否iOS
 * @returns {boolean} 是否iOS
 */
function isIOS() {
  const systemInfo = getSystemInfo();
  return systemInfo.platform === 'ios';
}

/**
 * 判断是否Android
 * @returns {boolean} 是否Android
 */
function isAndroid() {
  const systemInfo = getSystemInfo();
  return systemInfo.platform === 'android';
}

/**
 * 获取状态栏高度
 * @returns {number} 状态栏高度
 */
function getStatusBarHeight() {
  const systemInfo = getSystemInfo();
  return systemInfo.statusBarHeight || 0;
}

/**
 * 获取屏幕宽度
 * @returns {number} 屏幕宽度
 */
function getScreenWidth() {
  const systemInfo = getSystemInfo();
  return systemInfo.screenWidth || 375;
}

/**
 * rpx转px
 * @param {number} rpx rpx值
 * @returns {number} px值
 */
function rpxToPx(rpx) {
  return (rpx * getScreenWidth()) / 750;
}

/**
 * px转rpx
 * @param {number} px px值
 * @returns {number} rpx值
 */
function pxToRpx(px) {
  return (px * 750) / getScreenWidth();
}

module.exports = {
  formatDate,
  formatRelativeTime,
  formatPrice,
  formatNumber,
  isValidPhone,
  isValidIdCard,
  isValidEmail,
  isValidUrl,
  throttle,
  debounce,
  deepClone,
  randomString,
  getUrlParams,
  objectToUrlParams,
  getTempImagePath,
  compressImage,
  chooseImage,
  previewImage,
  saveImageToPhotosAlbum,
  setClipboardData,
  getSystemInfo,
  isIOS,
  isAndroid,
  getStatusBarHeight,
  getScreenWidth,
  rpxToPx,
  pxToRpx
};
