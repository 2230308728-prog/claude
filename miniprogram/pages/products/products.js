// pages/products/products.js
const request = require('../../utils/request.js');

Page({
  data: {
    keyword: '',
    categoryId: '',
    currentCategory: '',
    sortType: 'default',
    priceOrder: 'desc',
    minPrice: '',
    maxPrice: '',
    stockFilter: {
      inStock: false,
      outOfStock: false
    },

    products: [],
    categories: [],

    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
    loading: false,

    showPopup: false
  },

  onLoad(options) {
    // 获取页面参数
    const { keyword, categoryId } = options;

    this.setData({
      keyword: keyword || '',
      categoryId: categoryId || '',
      currentCategory: categoryId || ''
    });

    this.loadCategories();
    this.loadProducts();
  },

  onPullDownRefresh() {
    this.setData({ page: 1 });
    this.loadProducts().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoreProducts();
    }
  },

  onShareAppMessage() {
    return {
      title: 'bmad研学商城',
      path: '/pages/products/products'
    };
  },

  // 加载分类
  async loadCategories() {
    try {
      const res = await request.get('/products/categories');
      this.setData({
        categories: res.data || []
      });
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  },

  // 加载产品列表
  async loadProducts() {
    if (this.data.loading) return;

    try {
      this.setData({ loading: true });

      const params = {
        page: this.data.page,
        pageSize: this.data.pageSize,
        isPublished: true
      };

      if (this.data.keyword) {
        params.keyword = this.data.keyword;
      }

      if (this.data.currentCategory) {
        params.categoryId = this.data.currentCategory;
      }

      if (this.data.sortType !== 'default') {
        params.sort = this.data.sortType;
        params.order = this.data.sortType === 'price' ? this.data.priceOrder : 'desc';
      }

      if (this.data.minPrice) {
        params.minPrice = this.data.minPrice;
      }

      if (this.data.maxPrice) {
        params.maxPrice = this.data.maxPrice;
      }

      // 库存筛选
      if (this.data.stockFilter.inStock && !this.data.stockFilter.outOfStock) {
        params.hasStock = true;
      }

      const res = await request.get('/products', params);

      const products = this.data.page === 1 ? res.data : [...this.data.products, ...res.data];

      this.setData({
        products,
        total: res.meta?.total || 0,
        hasMore: res.data.length >= this.data.pageSize,
        loading: false
      });
    } catch (error) {
      this.setData({ loading: false });
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载更多产品
  loadMoreProducts() {
    this.setData({
      page: this.data.page + 1
    });
    this.loadProducts();
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 搜索
  onSearch() {
    this.setData({
      page: 1,
      products: []
    });
    this.loadProducts();
  },

  // 选择分类
  selectCategory(e) {
    const categoryId = e.currentTarget.dataset.id;
    this.setData({
      currentCategory: categoryId,
      page: 1,
      products: []
    });
    this.loadProducts();
  },

  // 排序
  onSort(e) {
    const type = e.currentTarget.dataset.type;

    if (type === 'price' && this.data.sortType === 'price') {
      // 切换价格排序方向
      this.setData({
        priceOrder: this.data.priceOrder === 'asc' ? 'desc' : 'asc'
      });
    }

    this.setData({
      sortType: type,
      page: 1,
      products: []
    });
    this.loadProducts();
  },

  // 显示筛选弹窗
  showFilterPopup() {
    this.setData({
      showPopup: true
    });
  },

  // 隐藏筛选弹窗
  hideFilterPopup() {
    this.setData({
      showPopup: false
    });
  },

  // 阻止冒泡
  stopPropagation() {},

  // 最低价输入
  onMinPriceInput(e) {
    this.setData({
      minPrice: e.detail.value
    });
  },

  // 最高价输入
  onMaxPriceInput(e) {
    this.setData({
      maxPrice: e.detail.value
    });
  },

  // 切换库存筛选
  toggleStock(e) {
    const type = e.currentTarget.dataset.type;
    const stockFilter = this.data.stockFilter;
    stockFilter[type] = !stockFilter[type];
    this.setData({ stockFilter });
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      minPrice: '',
      maxPrice: '',
      stockFilter: {
        inStock: false,
        outOfStock: false
      }
    });
  },

  // 应用筛选
  applyFilter() {
    this.setData({
      page: 1,
      products: [],
      showPopup: false
    });
    this.loadProducts();
  },

  // 跳转到产品详情
  goToProduct(e) {
    const productId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/product/product?id=${productId}`
    });
  }
});
