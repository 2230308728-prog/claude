// utils/auth.js
const request = require('./request.js');

/**
 * 微信授权登录
 */
function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 调用后端接口进行登录
          request.post('/auth/wx/login', { code: res.code })
            .then((response) => {
              const { user, accessToken, refreshToken } = response.data;

              // 存储用户信息和 token
              wx.setStorageSync('userInfo', user);
              wx.setStorageSync('access_token', accessToken);
              wx.setStorageSync('refresh_token', refreshToken);

              // 更新全局数据
              const app = getApp();
              app.globalData.userInfo = user;
              app.globalData.token = accessToken;

              resolve(user);
            })
            .catch((err) => {
              wx.showToast({
                title: '登录失败，请重试',
                icon: 'none'
              });
              reject(err);
            });
        } else {
          wx.showToast({
            title: '获取授权码失败',
            icon: 'none'
          });
          reject(new Error('获取微信授权码失败'));
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '微信登录失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

/**
 * 获取用户信息（授权）
 */
function getUserInfo() {
  return new Promise((resolve, reject) => {
    // 先检查是否已登录
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('access_token');

    if (userInfo && token) {
      resolve(userInfo);
      return;
    }

    // 未登录，发起登录
    wxLogin()
      .then((user) => {
        resolve(user);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

/**
 * 退出登录
 */
function logout() {
  return new Promise((resolve) => {
    // 清除本地存储
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('access_token');
    wx.removeStorageSync('refresh_token');

    // 清除全局数据
    const app = getApp();
    app.globalData.userInfo = null;
    app.globalData.token = null;

    // 跳转到登录页
    wx.reLaunch({
      url: '/pages/login/login'
    });

    resolve();
  });
}

/**
 * 检查登录状态
 */
function checkLogin() {
  const token = wx.getStorageSync('access_token');
  const userInfo = wx.getStorageSync('userInfo');

  return !!(token && userInfo);
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
  return wx.getStorageSync('userInfo') || null;
}

/**
 * 更新用户信息
 */
function updateUserInfo(userInfo) {
  wx.setStorageSync('userInfo', userInfo);

  const app = getApp();
  app.globalData.userInfo = userInfo;
}

/**
 * 手机号授权
 */
function getPhoneNumber(e) {
  return new Promise((resolve, reject) => {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const { encryptedData, iv } = e.detail;

      // 调用后端接口解密手机号
      request.post('/auth/wx/phone', { encryptedData, iv })
        .then((response) => {
          const { phoneNumber } = response.data;

          // 更新用户信息
          const userInfo = getCurrentUser();
          userInfo.phone = phoneNumber;
          updateUserInfo(userInfo);

          resolve(phoneNumber);
        })
        .catch((err) => {
          wx.showToast({
            title: '获取手机号失败',
            icon: 'none'
          });
          reject(err);
        });
    } else {
      reject(new Error('用户取消授权'));
    }
  });
}

module.exports = {
  wxLogin,
  getUserInfo,
  logout,
  checkLogin,
  getCurrentUser,
  updateUserInfo,
  getPhoneNumber
};
