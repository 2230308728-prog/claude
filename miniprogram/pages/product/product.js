// pages/product/product.js
const request = require('../../utils/request.js');
const auth = require('../../utils/auth.js');

Page({
  data: {
    productId: null,
    product: null,
    loading: false,
    isFavorite: false,
    reviewStats: null,
    reviews: [],
    hasMoreReviews: false
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ productId: id });
      this.loadProduct();
      this.checkFavorite();
      this.loadReviews();
    } else {
      wx.showToast({
        title: '产品不存在',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  onShareAppMessage() {
    return {
      title: this.data.product?.title || 'bmad研学商城',
      path: `/pages/product/product?id=${this.data.productId}`,
      imageUrl: this.data.product?.coverImage
    };
  },

  onShareTimeline() {
    return {
      title: this.data.product?.title || 'bmad研学商城',
      query: `id=${this.data.productId}`,
      imageUrl: this.data.product?.coverImage
    };
  },

  // 加载产品详情
  async loadProduct() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const res = await request.get(`/products/${this.data.productId}`);

      // 处理图片数组
      const images = res.data.images || [];
      if (res.data.coverImage && !images.includes(res.data.coverImage)) {
        images.unshift(res.data.coverImage);
      }

      this.setData({
        product: {
          ...res.data,
          images
        },
        loading: false
      });

      // 设置页面标题
      wx.setNavigationBarTitle({
        title: res.data.title
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 图片切换
  onImageChange(e) {
    // 可以在这里添加图片切换的逻辑
  },

  // 检查是否收藏
  async checkFavorite() {
    try {
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.includes(this.data.productId);
      this.setData({ isFavorite });
    } catch (error) {
      console.error('检查收藏失败:', error);
    }
  },

  // 切换收藏状态
  toggleFavorite() {
    let favorites = wx.getStorageSync('favorites') || [];
    const index = favorites.indexOf(this.data.productId);

    if (index > -1) {
      // 取消收藏
      favorites.splice(index, 1);
      this.setData({ isFavorite: false });
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      });
    } else {
      // 添加收藏
      favorites.push(this.data.productId);
      this.setData({ isFavorite: true });
      wx.showToast({
        title: '收藏成功',
        icon: 'success'
      });
    }

    wx.setStorageSync('favorites', favorites);
  },

  // 联系客服
  contactService() {
    wx.navigateTo({
      url: '/pages/service/service'
    });
  },

  // 加载评价统计和列表
  async loadReviews() {
    try {
      // 加载评价统计
      const statsRes = await request.get(`/reviews/stats?productId=${this.data.productId}`);
      this.setData({ reviewStats: statsRes.data });

      // 加载评价列表（仅显示已审核通过的评价）
      const reviewsRes = await request.get('/reviews', {
        productId: this.data.productId,
        status: 'APPROVED',
        pageSize: 3
      });
      this.setData({
        reviews: reviewsRes.data || [],
        hasMoreReviews: (reviewsRes.data || []).length >= 3
      });
    } catch (error) {
      console.error('加载评价失败:', error);
    }
  },

  // 查看更多评价
  viewMoreReviews() {
    wx.navigateTo({
      url: `/pages/reviews/reviews?tab=completed&productId=${this.data.productId}`
    });
  },

  // 预览图片
  previewImage(e) {
    const { url, urls } = e.currentTarget.dataset;
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 立即预订
  handleBuy() {
    // 检查登录状态
    if (!auth.checkLogin()) {
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
      return;
    }

    // 跳转到订单确认页面
    wx.navigateTo({
      url: `/pages/order-confirm/order-confirm?productId=${this.data.productId}`
    });
  }
});
