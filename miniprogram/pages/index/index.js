// pages/index/index.js
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    keyword: '',
    banners: [],
    hotProducts: [],
    newProducts: [],
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 检查登录状态
    const isLoggedIn = auth.checkLogin();
    if (!isLoggedIn) {
      // 未登录，静默登录
      auth.wxLogin().catch(() => {
        // 登录失败，不影响浏览
      });
    }
  },

  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onShareAppMessage() {
    return {
      title: 'bmad研学商城',
      path: '/pages/index/index'
    };
  },

  // 加载页面数据
  async loadData() {
    try {
      wx.showLoading({ title: '加载中...' });

      // 并发请求多个接口
      const [bannersRes, hotRes, newRes] = await Promise.all([
        request.get('/products/banners'),
        request.get('/products', { isPublished: true, sort: 'sales', order: 'desc', limit: 4 }),
        request.get('/products', { isPublished: true, sort: 'createdAt', order: 'desc', limit: 4 })
      ]);

      this.setData({
        banners: bannersRes.data || [],
        hotProducts: hotRes.data || [],
        newProducts: newRes.data || []
      });

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 搜索
  onSearch() {
    if (this.data.keyword.trim()) {
      wx.navigateTo({
        url: `/pages/products/products?keyword=${this.data.keyword}`
      });
    }
  },

  // 跳转到分类
  goToCategory(e) {
    const categoryId = e.currentTarget.dataset.category;
    wx.navigateTo({
      url: `/pages/products/products?categoryId=${categoryId}`
    });
  },

  // 跳转到产品列表
  goToProducts() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  },

  // 跳转到产品详情
  goToProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/product?id=${productId}`
    });
  }
});
