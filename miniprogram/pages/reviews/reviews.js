// pages/reviews/reviews.js
const request = require('../../utils/request.js');

Page({
  data: {
    currentTab: 'all',
    orders: [],
    loading: false
  },

  onLoad(options) {
    // 如果从其他页面跳转过来指定了tab
    if (options.tab) {
      this.setData({ currentTab: options.tab });
    }
    this.loadOrders();
  },

  onShow() {
    // 从其他页面返回时刷新
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载订单列表
  async loadOrders() {
    try {
      this.setData({ loading: true });

      const status = this.data.currentTab === 'pending' ? 'COMPLETED' : 'COMPLETED';
      const res = await request.get('/orders', {
        status,
        pageSize: 100
      });

      let orders = res.data || [];

      // 过滤并添加评价状态
      orders = await Promise.all(orders.map(async (order) => {
        try {
          const reviewRes = await request.get(`/reviews?orderId=${order.id}&productId=${order.productId}`);
          const review = reviewRes.data?.[0] || null;
          return { ...order, review };
        } catch (e) {
          return { ...order, review: null };
        }
      }));

      // 根据tab过滤
      if (this.data.currentTab === 'pending') {
        orders = orders.filter(order => !order.review);
      } else if (this.data.currentTab === 'completed') {
        orders = orders.filter(order => order.review);
      }

      // 格式化完成时间
      orders.forEach(order => {
        if (order.completedAt) {
          order.completedAt = this.formatDate(order.completedAt);
        }
      });

      this.setData({
        orders,
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
    this.loadOrders();
  },

  // 跳转到订单详情
  goToOrder(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order/order?id=${id}`
    });
  },

  // 创建评价
  createReview(e) {
    const { orderId, productId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/review-create/review-create?orderId=${orderId}&productId=${productId}`
    });
  },

  // 查看评价
  viewReview(e) {
    const { reviewId } = e.currentTarget.dataset;
    wx.showModal({
      title: '评价内容',
      content: '查看评价详情功能开发中',
      showCancel: false
    });
  },

  // 去逛逛
  goToShop() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
});
