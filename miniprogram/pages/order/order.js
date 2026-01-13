// pages/order/order.js
const request = require('../../utils/request.js');

Page({
  data: {
    orderId: null,
    order: null,
    loading: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ orderId: id });
      this.loadOrder();
    } else {
      wx.showToast({
        title: '订单不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShow() {
    // 从支付页返回时刷新订单状态
    if (this.data.order) {
      this.loadOrder();
    }
  },

  onPullDownRefresh() {
    this.loadOrder().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载订单详情
  async loadOrder() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const res = await request.get(`/orders/${this.data.orderId}`);

      // 格式化订单数据
      const order = {
        ...res.data,
        statusText: this.getStatusText(res.data.status),
        statusDesc: this.getStatusDesc(res.data.status),
        createdAt: this.formatDate(res.data.createdAt),
        paidAt: res.data.paidAt ? this.formatDate(res.data.paidAt) : null,
        completedAt: res.data.completedAt ? this.formatDate(res.data.completedAt) : null
      };

      this.setData({
        order,
        statusIcon: this.getStatusIcon(res.data.status),
        loading: false
      });

      // 设置页面标题
      wx.setNavigationBarTitle({
        title: `订单详情 - ${order.statusText}`
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
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

  // 获取状态描述
  getStatusDesc(status) {
    const descMap = {
      'PENDING': '请尽快完成支付，超时将自动取消',
      'PAID': '支付成功，等待确认',
      'CONFIRMED': '订单已确认，请按时参加',
      'COMPLETED': '订单已完成',
      'CANCELLED': '订单已取消',
      'REFUNDED': '订单已退款'
    };
    return descMap[status] || '';
  },

  // 获取状态图标
  getStatusIcon(status) {
    const iconMap = {
      'PENDING': '⏰',
      'PAID': '💰',
      'CONFIRMED': '✅',
      'COMPLETED': '🎉',
      'CANCELLED': '❌',
      'REFUNDED': '💸'
    };
    return iconMap[status] || '📋';
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

  // 取消订单
  cancelOrder() {
    wx.showModal({
      title: '提示',
      content: '确定要取消此订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.put(`/orders/${this.data.orderId}/cancel`);
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            });
            this.loadOrder();
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
  payOrder() {
    wx.showLoading({ title: '加载中...' });

    request.post(`/orders/${this.data.orderId}/pay`)
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
            this.loadOrder();
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
  confirmOrder() {
    wx.showModal({
      title: '提示',
      content: '确认订单已完成？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.put(`/orders/${this.data.orderId}/complete`);
            wx.showToast({
              title: '订单已完成',
              icon: 'success'
            });
            this.loadOrder();
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

  // 联系客服
  contactService() {
    wx.navigateTo({
      url: `/pages/service/service?orderNo=${this.data.order.orderNo}`
    });
  }
});
