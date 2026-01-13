// pages/coupon-select/coupon-select.js
const request = require('../../utils/request.js');

Page({
  data: {
    productId: null,
    amount: 0,
    coupons: [],
    selectedCouponId: null,
    selectedCoupon: null
  },

  onLoad(options) {
    const { productId, amount } = options;
    this.setData({
      productId: parseInt(productId),
      amount: parseFloat(amount)
    });
    this.loadAvailableCoupons();
  },

  // 加载可用优惠券
  async loadAvailableCoupons() {
    try {
      wx.showLoading({ title: '加载中...' });

      const res = await request.get('/coupons/my?status=AVAILABLE');

      // 过滤并格式化优惠券
      const coupons = (res.data || []).map(item => {
        const expiresAt = new Date(item.expiresAt);
        const now = new Date();

        // 检查是否过期
        if (expiresAt < now) {
          return null;
        }

        // 格式化过期时间
        const year = expiresAt.getFullYear();
        const month = String(expiresAt.getMonth() + 1).padStart(2, '0');
        const day = String(expiresAt.getDate()).padStart(2, '0');

        return {
          ...item,
          expiresText: `${year}-${month}-${day}`
        };
      }).filter(item => item !== null);

      this.setData({ coupons });
    } catch (error) {
      console.error('加载优惠券失败:', error);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 选择优惠券
  selectCoupon(e) {
    const coupon = e.currentTarget.dataset.coupon;
    const selectedCouponId = this.data.selectedCouponId === coupon.coupon.id ? null : coupon.coupon.id;
    const selectedCoupon = selectedCouponId ? coupon : null;

    this.setData({
      selectedCouponId,
      selectedCoupon
    });
  },

  // 确认选择
  confirmSelection() {
    if (!this.data.selectedCoupon) {
      wx.showToast({
        title: '请选择优惠券',
        icon: 'none'
      });
      return;
    }

    // 通过全局数据传递选中的优惠券
    getApp().globalData.selectedCoupon = this.data.selectedCoupon.coupon;

    wx.navigateBack();
  }
});
