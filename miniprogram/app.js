// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: 'http://localhost:3000/api/v1'
  },

  onLaunch() {
    // 初始化云开发环境（如果需要）
    // 检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 应用从后台进入前台时触发
  },

  onHide() {
    // 应用从前台进入后台时触发
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('access_token');
    const userInfo = wx.getStorageSync('userInfo');

    if (token && userInfo) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  // 设置用户信息
  setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = token;

    // 持久化存储
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('access_token', token);
  },

  // 清除用户信息
  clearUserInfo() {
    this.globalData.userInfo = null;
    this.globalData.token = null;

    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('access_token');
    wx.removeStorageSync('refresh_token');
  }
});
