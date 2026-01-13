// pages/addresses/addresses.js
const request = require('../../utils/request.js');
const { isValidPhone } = require('../../utils/util.js');

Page({
  data: {
    addresses: [],
    showModal: false,
    isEdit: false,
    editId: null,
    formData: {
      name: '',
      phone: '',
      region: [],
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    }
  },

  onLoad(options) {
    // 检查是否从选择地址模式进入
    this.selectMode = options.selectMode === 'true';

    this.loadAddresses();
  },

  onShow() {
    // 从其他页面返回时刷新
    this.loadAddresses();
  },

  onPullDownRefresh() {
    this.loadAddresses().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载地址列表
  async loadAddresses() {
    try {
      const res = await request.get('/users/addresses');
      this.setData({
        addresses: res.data || []
      });
    } catch (error) {
      console.error('加载地址失败:', error);
      // 如果接口不存在，使用本地存储
      const localAddresses = wx.getStorageSync('addresses') || [];
      this.setData({
        addresses: localAddresses
      });
    }
  },

  // 添加地址
  addAddress() {
    this.setData({
      showModal: true,
      isEdit: false,
      editId: null,
      formData: {
        name: '',
        phone: '',
        region: [],
        province: '',
        city: '',
        district: '',
        detail: '',
        isDefault: false
      }
    });
  },

  // 编辑地址
  editAddress(e) {
    const address = e.currentTarget.dataset.address;

    this.setData({
      showModal: true,
      isEdit: true,
      editId: address.id,
      formData: {
        name: address.name,
        phone: address.phone,
        region: [address.province, address.city, address.district],
        province: address.province,
        city: address.city,
        district: address.district,
        detail: address.detail,
        isDefault: address.isDefault || false
      }
    });
  },

  // 输入变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;

    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 地区选择变化
  onRegionChange(e) {
    const region = e.detail.value;

    this.setData({
      'formData.region': region,
      'formData.province': region[0],
      'formData.city': region[1],
      'formData.district': region[2]
    });
  },

  // 默认地址选择变化
  onDefaultChange(e) {
    this.setData({
      'formData.isDefault': e.detail.value.length > 0
    });
  },

  // 表单验证
  validateForm() {
    const { formData } = this.data;

    if (!formData.name.trim()) {
      wx.showToast({
        title: '请输入联系人姓名',
        icon: 'none'
      });
      return false;
    }

    if (!formData.phone.trim()) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'none'
      });
      return false;
    }

    if (!isValidPhone(formData.phone)) {
      wx.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      });
      return false;
    }

    if (formData.region.length === 0) {
      wx.showToast({
        title: '请选择所在地区',
        icon: 'none'
      });
      return false;
    }

    if (!formData.detail.trim()) {
      wx.showToast({
        title: '请输入详细地址',
        icon: 'none'
      });
      return false;
    }

    return true;
  },

  // 保存地址
  async saveAddress() {
    if (!this.validateForm()) {
      return;
    }

    const { formData, isEdit, editId } = this.data;

    try {
      wx.showLoading({ title: '保存中...' });

      if (isEdit) {
        // 编辑
        await request.put(`/users/addresses/${editId}`, formData);
      } else {
        // 新增
        await request.post('/users/addresses', formData);
      }

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      this.closeModal();
      this.loadAddresses();
    } catch (error) {
      wx.hideLoading();

      // 如果接口不存在，保存到本地
      if (error.message && error.message.includes('404')) {
        this.saveToLocal();
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    }
  },

  // 保存到本地存储
  saveToLocal() {
    const { formData, isEdit, editId } = this.data;
    let addresses = wx.getStorageSync('addresses') || [];

    if (isEdit) {
      // 编辑
      const index = addresses.findIndex(addr => addr.id === editId);
      if (index > -1) {
        addresses[index] = {
          ...addresses[index],
          ...formData,
          id: editId
        };
      }
    } else {
      // 新增
      const newAddress = {
        ...formData,
        id: Date.now()
      };
      addresses.unshift(newAddress);
    }

    // 如果设置为默认地址，取消其他默认地址
    if (formData.isDefault) {
      addresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === (isEdit ? editId : addresses[0].id)
      }));
    }

    wx.setStorageSync('addresses', addresses);

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });

    this.closeModal();
    this.loadAddresses();
  },

  // 设为默认地址
  async setDefault(e) {
    const { id } = e.currentTarget.dataset;

    try {
      await request.put(`/users/addresses/${id}/default`);
      wx.showToast({
        title: '设置成功',
        icon: 'success'
      });
      this.loadAddresses();
    } catch (error) {
      // 如果接口不存在，本地处理
      if (error.message && error.message.includes('404')) {
        let addresses = wx.getStorageSync('addresses') || [];
        addresses = addresses.map(addr => ({
          ...addr,
          isDefault: addr.id === id
        }));
        wx.setStorageSync('addresses', addresses);
        this.setData({ addresses });
        wx.showToast({
          title: '设置成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '设置失败',
          icon: 'none'
        });
      }
    }
  },

  // 删除地址
  deleteAddress(e) {
    const { id } = e.currentTarget.dataset;

    wx.showModal({
      title: '提示',
      content: '确定删除该地址吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await request.del(`/users/addresses/${id}`);
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            this.loadAddresses();
          } catch (error) {
            // 如果接口不存在，本地处理
            if (error.message && error.message.includes('404')) {
              let addresses = wx.getStorageSync('addresses') || [];
              addresses = addresses.filter(addr => addr.id !== id);
              wx.setStorageSync('addresses', addresses);
              this.setData({ addresses });
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              });
            }
          }
        }
      }
    });
  },

  // 选择地址（用于选择模式）
  selectAddress(e) {
    if (!this.selectMode) return;

    const { id } = e.currentTarget.dataset.address;
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];

    if (prevPage) {
      prevPage.setData({
        selectedAddressId: id
      });
      wx.navigateBack();
    }
  },

  // 关闭弹窗
  closeModal() {
    this.setData({
      showModal: false
    });
  },

  // 阻止冒泡
  stopPropagation() {}
});
