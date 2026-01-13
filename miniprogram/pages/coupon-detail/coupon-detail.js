// pages/coupon-detail/coupon-detail.js
const request = require('../../utils/request.js');

Page({
  data: {
    couponId: null,
    coupon: null,
    canClaim: true,
    validFrom: '',
    validUntil: '',
    progressPercent: 0,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ couponId: parseInt(options.id) });
      this.loadCouponDetail();
    }
  },

  onPullDownRefresh() {
    this.loadCouponDetail().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载优惠券详情
  async loadCouponDetail() {
    try {
      this.setData({ loading: true });

      const res = await request.get(`/coupons/${this.data.couponId}`);
      const coupon = res.data;

      const validFrom = this.formatDate(coupon.validFrom);
      const validUntil = this.formatDate(coupon.validUntil);
      const progressPercent = (coupon.claimedQuantity / coupon.totalQuantity) * 100;

      // 检查用户是否已领取
      let canClaim = true;
      try {
        const myCouponsRes = await request.get('/coupons/my');
        const myCoupon = myCouponsRes.data.find(c => c.couponId === this.data.couponId && c.status === 'AVAILABLE');
        canClaim = !myCoupon;
      } catch (e) {
        // 忽略错误
      }

      this.setData({
        coupon,
        validFrom,
        validUntil,
        progressPercent,
        canClaim,
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

  // 领取优惠券
  async claimCoupon() {
    const { coupon, canClaim } = this.data;

    if (!canClaim) {
      wx.showToast({
        title: '已领取过该优惠券',
        icon: 'none'
      });
      return;
    }

    if (coupon.claimedQuantity >= coupon.totalQuantity) {
      wx.showToast({
        title: '优惠券已抢光',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({ title: '领取中...' });

      await request.post('/coupons/claim', {
        couponId: this.data.couponId
      });

      wx.hideLoading();

      this.setData({ canClaim: false });

      wx.showToast({
        title: '领取成功',
        icon: 'success'
      });

      // 延迟跳转到我的优惠券页面
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/coupons/coupons?tab=available'
        });
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: error.message || '领取失败',
        icon: 'none'
      });
    }
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
});
