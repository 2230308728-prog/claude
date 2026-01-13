// utils/request.js
const app = getApp();

/**
 * 封装微信请求
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, header = {} } = options;

    // 获取 token
    const token = wx.getStorageSync('access_token');

    // 构建请求头
    const requestHeader = {
      'Content-Type': 'application/json',
      ...header
    };

    if (token) {
      requestHeader['Authorization'] = `Bearer ${token}`;
    }

    // 发起请求
    wx.request({
      url: `${app.globalData.apiBaseUrl}${url}`,
      method: method.toUpperCase(),
      data,
      header: requestHeader,
      success: (res) => {
        // 成功响应
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          // token 过期，尝试刷新
          handleTokenExpired().then(() => {
            // 刷新成功，重试请求
            return request(options);
          }).catch(() => {
            // 刷新失败，跳转登录
            redirectToLogin();
            reject(new Error('登录已过期，请重新登录'));
          });
        } else {
          // 其他错误
          const errorMsg = res.data?.message || '请求失败';
          showError(errorMsg);
          reject(new Error(errorMsg));
        }
      },
      fail: (err) => {
        // 网络错误
        showError('网络连接失败，请检查网络设置');
        reject(err);
      }
    });
  });
}

/**
 * 处理 token 过期
 */
function handleTokenExpired() {
  return new Promise((resolve, reject) => {
    const refreshToken = wx.getStorageSync('refresh_token');

    if (!refreshToken) {
      reject(new Error('没有刷新令牌'));
      return;
    }

    wx.request({
      url: `${app.globalData.apiBaseUrl}/auth/refresh`,
      method: 'POST',
      data: { refreshToken },
      success: (res) => {
        if (res.statusCode === 200 && res.data.data) {
          const { accessToken, refreshToken: newRefreshToken } = res.data.data;

          // 更新存储
          wx.setStorageSync('access_token', accessToken);
          wx.setStorageSync('refresh_token', newRefreshToken);
          app.globalData.token = accessToken;

          resolve(res.data.data);
        } else {
          reject(new Error('刷新令牌失败'));
        }
      },
      fail: () => {
        reject(new Error('刷新令牌失败'));
      }
    });
  });
}

/**
 * 跳转到登录页
 */
function redirectToLogin() {
  // 清除用户信息
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('refresh_token');
  wx.removeStorageSync('userInfo');
  app.globalData.token = null;
  app.globalData.userInfo = null;

  // 跳转登录页
  wx.reLaunch({
    url: '/pages/login/login'
  });
}

/**
 * 显示错误提示
 */
function showError(message) {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
}

/**
 * 显示成功提示
 */
function showSuccess(message) {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: 2000
  });
}

/**
 * 显示加载提示
 */
function showLoading(title = '加载中...') {
  wx.showLoading({
    title,
    mask: true
  });
}

/**
 * 隐藏加载提示
 */
function hideLoading() {
  wx.hideLoading();
}

/**
 * GET 请求
 */
function get(url, data = {}) {
  return request({ url, method: 'GET', data });
}

/**
 * POST 请求
 */
function post(url, data = {}) {
  return request({ url, method: 'POST', data });
}

/**
 * PUT 请求
 */
function put(url, data = {}) {
  return request({ url, method: 'PUT', data });
}

/**
 * DELETE 请求
 */
function del(url, data = {}) {
  return request({ url, method: 'DELETE', data });
}

module.exports = {
  request,
  get,
  post,
  put,
  delete: del,
  showSuccess,
  showError,
  showLoading,
  hideLoading
};
