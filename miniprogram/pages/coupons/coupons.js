// pages/coupons/coupons.js
const request = require('../../utils/request.js');

Page({
  data: {
    currentTab: 'available',
    coupons: [],
    availableCount: 0,
    loading: false
  },

  onLoad(options) {
    // 如果从其他页面跳转过来指定了tab
    if (options.tab) {
      this.setData({ currentTab: options.tab });
    }
    this.loadCoupons();
  },

  onShow() {
    // 从其他页面返回时刷新
    this.loadCoupons();
  },

  onPullDownRefresh() {
    this.loadCoupons().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载优惠券列表
  async loadCoupons() {
    try {
      this.setData({ loading: true });

      const statusMap = {
        available: 'AVAILABLE',
        used: 'USED',
        expired: 'EXPIRED'
      };

      const res = await request.get('/coupons/my', {
        status: statusMap[this.data.currentTab]
      });

      const coupons = res.data || [];

      this.setData({
        coupons,
        availableCount: this.data.currentTab === 'available' ? coupons.length : this.data.availableCount,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
    this.loadCoupons();
  },

  // 使用优惠券
  useCoupon(e) {
    const { id, couponId } = e.currentTarget.dataset;

    // 跳转到产品列表，用户选择产品后可以在订单确认页面使用优惠券
    wx.navigateTo({
      url: `/pages/products/products?couponId=${couponId}`
    });
  },

  // 去逛逛
  goToShop() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  }
});
