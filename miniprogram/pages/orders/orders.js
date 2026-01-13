// pages/orders/orders.js
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    currentTab: '',
    orders: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    loading: false
  },

  onLoad(options) {
    // 从其他页面跳转过来可能带有状态参数
    const { status } = options;
    if (status) {
      this.setData({ currentTab: status });
    }

    this.loadOrders();
  },

  onShow() {
    // 从订单详情返回时刷新列表
    if (this.data.orders.length > 0) {
      this.setData({
        page: 1,
        orders: []
      });
      this.loadOrders();
    }
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreOrders();
    }
  },

  // 加载订单列表
  async loadOrders() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize
      };

      if (this.data.currentTab) {
        params.status = this.data.currentTab;
      }

      const res = await request.get('/orders', params);

      // 格式化订单数据
      const orders = (res.data || []).map(order => ({
        ...order,
        statusText: this.getStatusText(order.status),
        createdAt: this.formatDate(order.createdAt)
      }));

      const orderList = this.data.page === 1 ? orders : [...this.data.orders, ...orders];

      this.setData({
        orders: orderList,
        hasMore: orders.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });

      // 如果是未登录，跳转到登录页
      if (error.message && error.message.includes('登录')) {
        wx.showModal({
          title: '提示',
          content: '请先登录',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: '/pages/login/login'
              });
            }
          }
        });
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      }
    }
  },

  // 加载更多订单
  loadMoreOrders() {
    this.setData({
      page: this.data.page + 1
    });
    this.loadOrders();
  },

  // 切换标签
  switchTab(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      currentTab: status,
      page: 1,
      orders: []
    });
    this.loadOrders();
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'PENDING': '待支付',
      'PAID': '已支付',
      'CONFIRMED': '已确认',
      'COMPLETED': '已完成',
      'CANCELLED': '已取消',
      'REFUNDED': '已退款'
    };
    return statusMap[status] || status;
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  // 跳转到订单详情
  goToOrder(e) {
    // 如果是点击按钮触发的，需要阻止冒泡
    const orderId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order/order?id=${orderId}`
    });
  },

  // 取消订单
  cancelOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '提示',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.put(`/orders/${orderId}/cancel`);
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            });
            // 刷新订单列表
            this.setData({
              page: 1,
              orders: []
            });
            this.loadOrders();
          } catch (error) {
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 支付订单
  payOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showLoading({ title: '加载中...' });

    request.post(`/orders/${orderId}/pay`)
      .then((res) => {
        wx.hideLoading();

        // 调用微信支付
        const { payment } = res.data;
        wx.requestPayment({
          timeStamp: payment.timeStamp,
          nonceStr: payment.nonceStr,
          package: payment.package,
          signType: payment.signType,
          paySign: payment.paySign,
          success: () => {
            wx.showToast({
              title: '支付成功',
              icon: 'success'
            });
            // 刷新订单列表
            this.setData({
              page: 1,
              orders: []
            });
            this.loadOrders();
          },
          fail: (err) => {
            if (err.errMsg.includes('cancel')) {
              wx.showToast({
                title: '已取消支付',
                icon: 'none'
              });
            } else {
              wx.showToast({
                title: '支付失败',
                icon: 'none'
              });
            }
          }
        });
      })
      .catch((error) => {
        wx.hideLoading();
        wx.showToast({
          title: '发起支付失败',
          icon: 'none'
        });
      });
  },

  // 确认完成
  confirmOrder(e) {
    const orderId = e.currentTarget.dataset.id;

    wx.showModal({
      title: '提示',
      content: '确认订单已完成？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.put(`/orders/${orderId}/complete`);
            wx.showToast({
              title: '订单已完成',
              icon: 'success'
            });
            // 刷新订单列表
            this.setData({
              page: 1,
              orders: []
            });
            this.loadOrders();
          } catch (error) {
            wx.showToast({
              title: '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 去逛逛
  goToShop() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  }
});
