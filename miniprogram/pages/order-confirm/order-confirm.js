// pages/order-confirm/order-confirm.js
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    productId: null,
    product: null,
    loading: false,
    submitting: false,
    agreed: false,
    minDate: '',
    formData: {
      participantName: '',
      participantAge: '',
      contactName: '',
      contactPhone: '',
      travelDate: '',
      remarks: ''
    }
  },

  onLoad(options) {
    const { productId } = options;

    if (!productId) {
      wx.showToast({
        title: '产品不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ productId });
    this.initMinDate();
    this.loadProduct();
    this.initUserInfo();
  },

  // 初始化最小日期（今天）
  initMinDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.setData({
      minDate: `${year}-${month}-${day}`
    });
  },

  // 加载产品信息
  async loadProduct() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const res = await request.get(`/products/${this.data.productId}`);

      // 检查库存
      if (!res.data.stock || res.data.stock <= 0) {
        wx.showModal({
          title: '提示',
          content: '该产品暂时售罄',
          showCancel: false,
          success: () => {
            wx.navigateBack();
          }
        });
        return;
      }

      this.setData({
        product: res.data,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  // 初始化用户信息
  initUserInfo() {
    const userInfo = auth.getCurrentUser();

    if (userInfo) {
      // 预填用户信息
      this.setData({
        'formData.contactName': userInfo.nickname || '',
        'formData.contactPhone': userInfo.phone || ''
      });
    }
  },

  // 输入变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;

    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 日期选择
  onDateChange(e) {
    this.setData({
      'formData.travelDate': e.detail.value
    });
  },

  // 协议勾选
  onAgreementChange(e) {
    this.setData({
      agreed: e.detail.value.length > 0
    });
  },

  // 显示服务协议
  showServiceAgreement() {
    wx.showModal({
      title: '服务协议',
      content: '1. 订单提交后请在规定时间内完成支付\n2. 出行日期需提前确认\n3. 如需退款请提前申请\n4. 最终解释权归平台所有\n\n（完整协议内容请参考官网）',
      showCancel: false
    });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;

    if (!formData.participantName) {
      wx.showToast({
        title: '请输入参与者姓名',
        icon: 'none'
      });
      return false;
    }

    if (!formData.participantAge) {
      wx.showToast({
        title: '请输入年龄',
        icon: 'none'
      });
      return false;
    }

    const age = parseInt(formData.participantAge);
    if (isNaN(age) || age < 1 || age > 100) {
      wx.showToast({
        title: '请输入正确的年龄',
        icon: 'none'
      });
      return false;
    }

    if (!formData.contactName) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      });
      return false;
    }

    if (!formData.contactPhone) {
      wx.showToast({
        title: '请输入联系人电话',
        icon: 'none'
      });
      return false;
    }

    // 验证手机号格式
    const phoneReg = /^1[3-9]\d{9}$/;
    if (!phoneReg.test(formData.contactPhone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }

    if (!formData.travelDate) {
      wx.showToast({
        title: '请选择出行日期',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 提交订单
  async handleSubmit() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先阅读并同意服务协议',
        icon: 'none'
      });
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    if (this.data.submitting) return;

    try {
      this.setData({ submitting: true });

      const orderData = {
        productId: this.data.productId,
        participantName: this.data.formData.participantName,
        participantAge: parseInt(this.data.formData.participantAge),
        contactName: this.data.formData.contactName,
        contactPhone: this.data.formData.contactPhone,
        travelDate: this.data.formData.travelDate,
        remarks: this.data.formData.remarks || undefined
      };

      const res = await request.post('/orders', orderData);

      wx.showToast({
        title: '订单创建成功',
        icon: 'success'
      });

      // 跳转到订单详情页
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order/order?id=${res.data.id}`
        });
      }, 1500);
    } catch (error) {
      this.setData({ submitting: false });

      // 检查是否是未登录错误
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
          title: error.message || '创建订单失败',
          icon: 'none'
        });
      }
    }
  }
});
