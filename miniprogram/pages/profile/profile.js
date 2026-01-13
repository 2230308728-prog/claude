// pages/profile/profile.js
const auth = require('../../utils/auth.js');
const request = require('../../utils/request.js');

Page({
  data: {
    userInfo: null,
    orderCount: {
      pending: 0,
      paid: 0,
      completed: 0,
      refund: 0
    }
  },

  onShow() {
    // 每次显示页面时重新加载用户信息
    this.loadUserInfo();
  },

  onShareAppMessage() {
    return {
      title: 'bmad研学商城',
      path: '/pages/index/index'
    };
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = auth.getCurrentUser();

    if (userInfo) {
      this.setData({ userInfo });
      this.loadOrderCount();
    } else {
      this.setData({
        userInfo: null,
        orderCount: {
          pending: 0,
          paid: 0,
          completed: 0,
          refund: 0
        }
      });
    }
  },

  // 加载订单数量
  async loadOrderCount() {
    try {
      // 获取各状态订单数量
      const [pendingRes, paidRes, completedRes, refundRes] = await Promise.all([
        request.get('/orders', { status: 'PENDING', pageSize: 1 }).catch(() => ({ meta: { total: 0 } })),
        request.get('/orders', { status: 'PAID', pageSize: 1 }).catch(() => ({ meta: { total: 0 } })),
        request.get('/orders', { status: 'COMPLETED', pageSize: 1 }).catch(() => ({ meta: { total: 0 } })),
        request.get('/orders', { status: 'REFUNDED', pageSize: 1 }).catch(() => ({ meta: { total: 0 } }))
      ]);

      this.setData({
        orderCount: {
          pending: pendingRes.meta?.total || 0,
          paid: paidRes.meta?.total || 0,
          completed: completedRes.meta?.total || 0,
          refund: refundRes.meta?.total || 0
        }
      });
    } catch (error) {
      console.error('加载订单数量失败:', error);
    }
  },

  // 登录
  handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          auth.logout();
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转到订单列表
  goToOrders(e) {
    const status = e.currentTarget.dataset.status || '';
    wx.navigateTo({
      url: `/pages/orders/orders?status=${status}`
    });
  },

  // 我的收藏
  goToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    });
  },

  // 我的优惠券
  goToCoupons() {
    wx.navigateTo({
      url: '/pages/coupons/coupons'
    });
  },

  // 收货地址
  goToAddress() {
    wx.navigateTo({
      url: '/pages/addresses/addresses'
    });
  },

  // 联系客服
  contactService() {
    wx.navigateTo({
      url: '/pages/service/service'
    });
  },

  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: 'bmad研学商城\n\n专业的研学旅行产品预订平台\n\n版本：v1.0.0',
      showCancel: false
    });
  }
});
