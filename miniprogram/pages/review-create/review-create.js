// pages/review-create/review-create.js
const request = require('../../utils/request.js');

Page({
  data: {
    orderId: null,
    productId: null,
    product: {
      image: '',
      title: ''
    },
    orderNo: '',
    rating: 0,
    ratingTexts: ['非常差', '较差', '一般', '满意', '非常满意'],
    content: '',
    images: [],
    isAnonymous: false,
    submitting: false
  },

  onLoad(options) {
    const { orderId, productId } = options;
    if (!orderId || !productId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({ orderId, productId });
    this.loadOrderDetail();
  },

  // 加载订单详情
  async loadOrderDetail() {
    try {
      wx.showLoading({ title: '加载中...' });

      const res = await request.get(`/orders/${this.data.orderId}`);

      this.setData({
        product: {
          image: res.data.product.images[0] || '',
          title: res.data.product.title
        },
        orderNo: res.data.orderNo
      });

      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 选择评分
  selectRating(e) {
    const rating = e.currentTarget.dataset.rating;
    this.setData({ rating });
  },

  // 输入评价内容
  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  // 选择图片
  chooseImage() {
    const remaining = 9 - this.data.images.length;
    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths;
        this.uploadImages(tempFilePaths);
      }
    });
  },

  // 上传图片
  async uploadImages(filePaths) {
    wx.showLoading({ title: '上传中...' });

    try {
      const uploadPromises = filePaths.map(filePath => {
        return new Promise((resolve, reject) => {
          wx.uploadFile({
            url: `${request.baseURL}/upload`,
            filePath: filePath,
            name: 'file',
            header: {
              'Authorization': `Bearer ${wx.getStorageSync('token')}`
            },
            success: (res) => {
              try {
                const data = JSON.parse(res.data);
                resolve(data.url);
              } catch (e) {
                reject(e);
              }
            },
            fail: reject
          });
        });
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      this.setData({
        images: [...this.data.images, ...uploadedUrls]
      });

      wx.hideLoading();
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      });
    } catch (error) {
      wx.hideLoading();
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      });
    }
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== index);
    this.setData({ images });
  },

  // 切换匿名
  onAnonymousChange(e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  // 提交评价
  async submitReview() {
    // 验证评分
    if (this.data.rating === 0) {
      wx.showToast({
        title: '请选择评分',
        icon: 'none'
      });
      return;
    }

    // 验证评价内容
    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入评价内容',
        icon: 'none'
      });
      return;
    }

    try {
      this.setData({ submitting: true });
      wx.showLoading({ title: '提交中...' });

      await request.post('/reviews', {
        orderId: this.data.orderId,
        productId: this.data.productId,
        rating: this.data.rating,
        content: this.data.content,
        images: this.data.images,
        isAnonymous: this.data.isAnonymous
      });

      wx.hideLoading();
      wx.showToast({
        title: '评价成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (error) {
      this.setData({ submitting: false });
      wx.hideLoading();
      wx.showToast({
        title: error.message || '提交失败',
        icon: 'none'
      });
    }
  }
});
