// pages/login/login.js
const auth = require('../../utils/auth.js');

Page({
  data: {
    loading: false,
    agreed: false
  },

  onLoad() {
    // 如果已经登录，直接跳转
    if (auth.checkLogin()) {
      this.redirectToHome();
    }
  },

  // 获取用户信息授权
  async onGetUserInfo(e) {
    const { userInfo } = e.detail;

    if (!userInfo) {
      wx.showToast({
        title: '需要授权才能登录',
        icon: 'none'
      });
      return;
    }

    if (!this.data.agreed) {
      wx.showToast({
        title: '请先阅读并同意用户协议',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ loading: true });

      // 调用微信登录
      await auth.wxLogin();

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        this.redirectToHome();
      }, 1500);
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      });
    }
  },

  // 协议勾选状态变化
  onAgreementChange(e) {
    this.setData({
      agreed: e.detail.value.length > 0
    });
  },

  // 跳转到用户协议
  goToUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '1. 用户应遵守国家法律法规\n2. 用户应对自己的行为负责\n3. 平台有权对违规行为进行处理\n\n（完整协议内容请参考官网）',
      showCancel: false
    });
  },

  // 跳转到隐私政策
  goToPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '1. 我们重视用户隐私保护\n2. 信息收集仅用于提供服务\n3. 不会泄露用户个人信息\n\n（完整政策内容请参考官网）',
      showCancel: false
    });
  },

  // 跳转到首页
  redirectToHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
