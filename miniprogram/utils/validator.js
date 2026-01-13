// utils/validator.js

/**
 * 验证规则集合
 */
const rules = {
  // 必填
  required: (value) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  },

  // 手机号
  phone: (value) => {
    return /^1[3-9]\d{9}$/.test(value);
  },

  // 邮箱
  email: (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  // 身份证号
  idCard: (value) => {
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(value);
  },

  // URL
  url: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  // 数字
  number: (value) => {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },

  // 整数
  integer: (value) => {
    return Number.isInteger(Number(value));
  },

  // 最小值
  min: (value, min) => {
    return Number(value) >= min;
  },

  // 最大值
  max: (value, max) => {
    return Number(value) <= max;
  },

  // 最小长度
  minLength: (value, length) => {
    return String(value).length >= length;
  },

  // 最大长度
  maxLength: (value, length) => {
    return String(value).length <= length;
  },

  // 正则表达式
  pattern: (value, regex) => {
    return new RegExp(regex).test(value);
  }
};

/**
 * 验证单个字段
 * @param {*} value 值
 * @param {Array} validators 验证器数组
 * @returns {Object} 验证结果 { valid: boolean, message: string }
 */
function validateField(value, validators) {
  if (!Array.isArray(validators) || validators.length === 0) {
    return { valid: true };
  }

  for (const validator of validators) {
    if (typeof validator === 'string') {
      if (!rules[validator]) {
        console.warn(`Validator "${validator}" is not defined`);
        continue;
      }

      if (!rules[validator](value)) {
        return {
          valid: false,
          message: `${validator} validation failed`
        };
      }
    } else if (typeof validator === 'function') {
      const result = validator(value);
      if (result !== true) {
        return {
          valid: false,
          message: typeof result === 'string' ? result : 'validation failed'
        };
      }
    } else if (typeof validator === 'object') {
      const { rule, params, message } = validator;

      if (!rules[rule]) {
        console.warn(`Validator rule "${rule}" is not defined`);
        continue;
      }

      const isValid = params !== undefined
        ? rules[rule](value, params)
        : rules[rule](value);

      if (!isValid) {
        return {
          valid: false,
          message: message || `${rule} validation failed`
        };
      }
    }
  }

  return { valid: true };
}

/**
 * 验证表单
 * @param {Object} data 表单数据
 * @param {Object} schema 验证规则
 * @returns {Object} 验证结果 { valid: boolean, errors: Object }
 */
function validate(data, schema) {
  const errors = {};

  for (const field in schema) {
    const validators = schema[field];
    const value = data[field];

    const result = validateField(value, validators);

    if (!result.valid) {
      errors[field] = result.message;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * 创建表单验证器
 * @param {Object} schema 验证规则
 * @returns {Function} 验证函数
 */
function createValidator(schema) {
  return function (data) {
    return validate(data, schema);
  };
}

/**
 * 常用验证规则预设
 */
const presets = {
  // 用户名
  username: ['required', { pattern: '^[a-zA-Z0-9_]{4,20}$', message: '用户名必须是4-20位字母、数字或下划线' }],

  // 密码
  password: ['required', { minLength: 6, message: '密码至少6位' }],

  // 手机号
  phone: ['required', { rule: 'phone', message: '请输入正确的手机号' }],

  // 验证码
  code: ['required', { pattern: '^\\d{6}$', message: '请输入6位验证码' }],

  // 姓名
  name: ['required', { minLength: 2, message: '请输入姓名' }],

  // 年龄
  age: [
    'required',
    { rule: 'integer', message: '请输入正确的年龄' },
    { rule: 'min', params: 1, message: '年龄必须大于0' },
    { rule: 'max', params: 150, message: '年龄必须小于150' }
  ],

  // 日期
  date: ['required', { pattern: '^\\d{4}-\\d{2}-\\d{2}$', message: '请选择正确的日期' }]
};

module.exports = {
  rules,
  validateField,
  validate,
  createValidator,
  presets
};
