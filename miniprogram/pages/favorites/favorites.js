// pages/favorites/favorites.js
const request = require('../../utils/request.js');

Page({
  data: {
    favorites: [],
    editMode: false,
    selectedIds: [],
    selectedCount: 0,
    loading: false
  },

  onLoad() {
    this.loadFavorites();
  },

  onShow() {
    // 从其他页面返回时刷新
    if (this.data.favorites.length > 0) {
      this.loadFavorites();
    }
  },

  onPullDownRefresh() {
    this.loadFavorites().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载收藏列表
  async loadFavorites() {
    try {
      this.setData({ loading: true });

      // 从本地存储获取收藏的产品ID列表
      const favoriteIds = wx.getStorageSync('favorites') || [];

      if (favoriteIds.length === 0) {
        this.setData({
          favorites: [],
          loading: false
        });
        return;
      }

      // 调用接口获取产品详情（批量）
      // 注意：这里假设后端有批量获取产品的接口
      // 如果没有，需要逐个获取或改造接口
      const promises = favoriteIds.map(productId => {
        return request.get(`/products/${productId}`).catch(() => null);
      });

      const results = await Promise.all(promises);

      // 过滤掉已删除或下架的产品
      const validProducts = results
        .filter(result => result && result.data && result.data.isPublished)
        .map(result => ({
          productId: result.data.id,
          product: result.data,
          createdAt: Date.now()
        }));

      this.setData({
        favorites: validProducts,
        loading: false
      });

      // 更新本地存储，移除无效的收藏
      const validIds = validProducts.map(item => item.productId);
      wx.setStorageSync('favorites', validIds);
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    }
  },

  // 切换编辑模式
  toggleEditMode() {
    this.setData({
      editMode: !this.data.editMode,
      selectedIds: [],
      selectedCount: 0
    });
  },

  // 选择/取消选择
  toggleSelect(e) {
    const { id } = e.currentTarget.dataset;
    const { selectedIds } = this.data;

    const index = selectedIds.indexOf(id);

    if (index > -1) {
      selectedIds.splice(index, 1);
    } else {
      selectedIds.push(id);
    }

    this.setData({
      selectedIds,
      selectedCount: selectedIds.length
    });
  },

  // 取消收藏
  cancelFavorite(e) {
    const { id, productId } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: '确定取消收藏吗？',
      success: async (res) => {
        if (res.confirm) {
          // 从本地存储移除
          let favorites = wx.getStorageSync('favorites') || [];
          favorites = favorites.filter(id => id !== productId);
          wx.setStorageSync('favorites', favorites);

          // 更新列表
          this.setData({
            favorites: this.data.favorites.filter(item => item.productId !== productId)
          });

          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          });
        }
      }
    });
  },

  // 删除选中的收藏
  deleteSelected() {
    const { selectedIds } = this.data;

    if (selectedIds.length === 0) {
      wx.showToast({
        title: '请先选择商品',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '提示',
      content: `确定删除选中的 ${selectedIds.length} 个收藏吗？`,
      success: (res) => {
        if (res.confirm) {
          // 从本地存储移除
          let favoriteIds = wx.getStorageSync('favorites') || [];
          favoriteIds = favoriteIds.filter(id => !selectedIds.includes(id));
          wx.setStorageSync('favorites', favoriteIds);

          // 更新列表
          this.setData({
            favorites: this.data.favorites.filter(item => !selectedIds.includes(item.productId)),
            selectedIds: [],
            selectedCount: 0,
            editMode: false
          });

          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 全部加入预订（此功能可能不适用，因为研学产品通常不需要购物车）
  addAllToCart() {
    wx.showToast({
      title: '请逐个选择产品预订',
      icon: 'none'
    });
  },

  // 立即预订
  buyNow(e) {
    const { productId } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/order-confirm/order-confirm?productId=${productId}`
    });
  },

  // 跳转到产品详情
  goToProduct(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/product/product?id=${id}`
    });
  },

  // 去逛逛
  goToShop() {
    wx.switchTab({
      url: '/pages/products/products'
    });
  }
});
