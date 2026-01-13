// pages/service/service.js
const request = require('../../utils/request.js');

Page({
  data: {
    types: ['订单问题', '支付问题', '产品咨询', '退款问题', '账号问题', '其他问题'],
    typeIndex: 0,
    orderNo: '',
    content: '',
    phone: '',
    submitting: false,
    showFAQ: false,
    faqs: [
      {
        question: '如何下单？',
        answer: '选择您心仪的产品，点击"立即预订"，填写相关信息后提交订单，然后完成支付即可。',
        expanded: false
      },
      {
        question: '如何使用优惠券？',
        answer: '在订单确认页面，选择您可用的优惠券，系统会自动计算优惠金额。',
        expanded: false
      },
      {
        question: '如何申请退款？',
        answer: '在订单详情页面，点击"申请退款"按钮，填写退款原因并提交，等待管理员审核。',
        expanded: false
      },
      {
        question: '退款多久到账？',
        answer: '审核通过后，退款将在1-3个工作日内原路返回到您的支付账户。',
        expanded: false
      },
      {
        question: '如何修改订单信息？',
        answer: '已支付的订单如需修改，请联系客服处理。未支付的订单可以直接取消后重新下单。',
        expanded: false
      },
      {
        question: '产品可以退换吗？',
        answer: '研学产品属于特殊商品，一旦购买不支持退换。如因特殊情况需要退换，请联系客服协商。',
        expanded: false
      },
      {
        question: '如何联系客服？',
        answer: '您可以通过本页面的电话、微信或邮件联系我们，我们的工作时间是周一至周五9:00-18:00。',
        expanded: false
      }
    ]
  },

  onLoad(options) {
    // 如果从订单页面跳转过来，带订单号
    if (options.orderNo) {
      this.setData({ orderNo: options.orderNo });
    }
  },

  // 拨打电话
  makePhoneCall() {
    wx.makePhoneCall({
      phoneNumber: '400-123-4567',
      fail: () => {
        wx.showToast({
          title: '请手动拨打400-123-4567',
          icon: 'none'
        });
      }
    });
  },

  // 复制微信号
  copyWeChat() {
    wx.setClipboardData({
      data: 'bmad_service',
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 发送邮件
  sendEmail() {
    wx.setClipboardData({
      data: 'service@bmad.com',
      success: () => {
        wx.showToast({
          title: '邮箱地址已复制',
          icon: 'success'
        });
      }
    });
  },

  // 查看常见问题
  viewFAQ() {
    this.setData({ showFAQ: true });
  },

  // 隐藏常见问题
  hideFAQ() {
    this.setData({ showFAQ: false });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 展开/收起常见问题
  toggleFAQ(e) {
    const index = e.currentTarget.dataset.index;
    const faqs = this.data.faqs;
    faqs[index].expanded = !faqs[index].expanded;
    this.setData({ faqs });
  },

  // 选择问题类型
  selectType(e) {
    this.setData({ typeIndex: e.detail.value });
  },

  // 输入订单号
  onOrderNoInput(e) {
    this.setData({ orderNo: e.detail.value });
  },

  // 输入问题描述
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 输入联系电话
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  // 提交反馈
  async submitFeedback() {
    const { typeIndex, content, phone } = this.data;

    if (!content.trim()) {
      wx.showToast({
        title: '请输入问题描述',
        icon: 'none'
      });
      return;
    }

    if (!phone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return;
    }

    // 验证手机号
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ submitting: true });
      wx.showLoading({ title: '提交中...' });

      // TODO: 调用后端API提交反馈
      // await request.post('/feedback', {
      //   type: this.data.types[typeIndex],
      //   orderNo: this.data.orderNo,
      //   content,
      //   phone
      // });

      wx.hideLoading();

      wx.showToast({
        title: '提交成功，我们会尽快联系您',
        icon: 'success',
        duration: 2000
      });

      // 清空表单
      this.setData({
        typeIndex: 0,
        orderNo: '',
        content: '',
        phone: '',
        submitting: false
      });

      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);

    } catch (error) {
      this.setData({ submitting: false });
      wx.hideLoading();
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      });
    }
  }
});
