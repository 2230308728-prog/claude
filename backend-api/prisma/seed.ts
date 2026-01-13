import 'dotenv/config';
import { PrismaClient, Role, UserStatus, ProductStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('开始种子数据...');

  // 1. 创建产品分类
  console.log('创建产品分类...');
  const categories = await Promise.all([
    prisma.productCategory.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        name: '户外探险',
        description: '户外生存、自然探索类研学活动',
        sortOrder: 1,
      },
      update: {},
    }),
    prisma.productCategory.upsert({
      where: { id: 2 },
      create: {
        id: 2,
        name: '科学探索',
        description: '科学实验、博物馆参观类研学活动',
        sortOrder: 2,
      },
      update: {},
    }),
    prisma.productCategory.upsert({
      where: { id: 3 },
      create: {
        id: 3,
        name: '艺术创意',
        description: '美术、音乐、手工等艺术类研学活动',
        sortOrder: 3,
      },
      update: {},
    }),
    prisma.productCategory.upsert({
      where: { id: 4 },
      create: {
        id: 4,
        name: '农事体验',
        description: '农耕体验、乡村生活类研学活动',
        sortOrder: 4,
      },
      update: {},
    }),
    prisma.productCategory.upsert({
      where: { id: 5 },
      create: {
        id: 5,
        name: '历史文化',
        description: '古迹参观、传统文化体验类研学活动',
        sortOrder: 5,
      },
      update: {},
    }),
  ]);

  console.log(`✅ 创建了 ${categories.length} 个产品分类`);

  // 2. 创建示例产品
  console.log('创建示例产品...');
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        title: '小小探险家：城市户外生存挑战',
        description: '在专业教练带领下，学习野外生存技能，包括辨别方向、搭建帐篷、生火技巧等，培养孩子的野外生存能力和团队合作精神。',
        categoryId: 1,
        price: '299.00',
        originalPrice: '399.00',
        stock: 20,
        minAge: 7,
        maxAge: 12,
        duration: '3小时',
        location: '奥林匹克森林公园',
        images: [
          'https://picsum.photos/400/300?random=1',
          'https://picsum.photos/400/300?random=2',
        ],
        status: ProductStatus.PUBLISHED,
        featured: true,
        viewCount: 0,
        bookingCount: 0,
      },
      update: {},
    }),
    prisma.product.upsert({
      where: { id: 2 },
      create: {
        id: 2,
        title: '科学实验室：小小科学家体验日',
        description: '在真实实验室环境中，进行有趣的科学实验，包括化学变色反应、物理力学演示等，激发孩子的科学探索兴趣。',
        categoryId: 2,
        price: '399.00',
        stock: 15,
        minAge: 6,
        maxAge: 10,
        duration: '4小时',
        location: '中关村科学实验室',
        images: [
          'https://picsum.photos/400/300?random=3',
          'https://picsum.photos/400/300?random=4',
        ],
        status: ProductStatus.PUBLISHED,
        featured: true,
        viewCount: 0,
        bookingCount: 0,
      },
      update: {},
    }),
    prisma.product.upsert({
      where: { id: 3 },
      create: {
        id: 3,
        title: '创意陶艺工坊：手作陶瓷体验',
        description: '学习陶艺制作的基本技法，包括捏塑、拉坯、上釉等，亲手制作属于自己的陶艺作品，培养孩子的创造力和动手能力。',
        categoryId: 3,
        price: '259.00',
        stock: 12,
        minAge: 5,
        maxAge: 12,
        duration: '3小时',
        location: '798艺术区陶艺工坊',
        images: [
          'https://picsum.photos/400/300?random=5',
          'https://picsum.photos/400/300?random=6',
        ],
        status: ProductStatus.PUBLISHED,
        featured: false,
        viewCount: 0,
        bookingCount: 0,
      },
      update: {},
    }),
    prisma.product.upsert({
      where: { id: 4 },
      create: {
        id: 4,
        title: '农耕体验：小小农场主一日游',
        description: '体验真实的农场生活，包括播种、浇水、收获等农事活动，与可爱的农场动物互动，让孩子了解食物的来源。',
        categoryId: 4,
        price: '199.00',
        stock: 25,
        minAge: 4,
        maxAge: 10,
        duration: '5小时',
        location: '小汤山现代农业示范园',
        images: [
          'https://picsum.photos/400/300?random=7',
          'https://picsum.photos/400/300?random=8',
        ],
        status: ProductStatus.PUBLISHED,
        featured: false,
        viewCount: 0,
        bookingCount: 0,
      },
      update: {},
    }),
    prisma.product.upsert({
      where: { id: 5 },
      create: {
        id: 5,
        title: '故宫探秘：小小文物修复师',
        description: '在故宫博物院专业讲解员的带领下，参观珍贵文物，学习文物保护知识，体验文物修复过程，感受中华文化的博大精深。',
        categoryId: 5,
        price: '349.00',
        stock: 18,
        minAge: 7,
        maxAge: 14,
        duration: '4小时',
        location: '故宫博物院',
        images: [
          'https://picsum.photos/400/300?random=9',
          'https://picsum.photos/400/300?random=10',
        ],
        status: ProductStatus.PUBLISHED,
        featured: true,
        viewCount: 0,
        bookingCount: 0,
      },
      update: {},
    }),
    prisma.product.upsert({
      where: { id: 6 },
      create: {
        id: 6,
        title: '森林探险：自然观察与野外生存',
        description: '在百望山森林公园进行自然探险活动，包括植物识别、昆虫观察、野外定向等，培养孩子的自然观察力和环保意识。',
        categoryId: 1,
        price: '269.00',
        originalPrice: '329.00',
        stock: 22,
        minAge: 8,
        maxAge: 13,
        duration: '4小时',
        location: '百望山森林公园',
        images: [
          'https://picsum.photos/400/300?random=11',
          'https://picsum.photos/400/300?random=12',
        ],
        status: ProductStatus.PUBLISHED,
        featured: true,
        viewCount: 0,
        bookingCount: 0,
      },
      update: {},
    }),
  ]);

  console.log(`✅ 创建了 ${products.length} 个示例产品`);

  // 3. 创建测试管理员用户
  console.log('创建测试管理员用户...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@bmad.com' },
    create: {
      email: 'admin@bmad.com',
      nickname: '超级管理员',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
    update: {},
  });

  // 存储管理员密码（使用 bcrypt 加密，实际应存储在单独的密码表中）
  // 这里需要安装 bcrypt，暂时跳过密码存储
  // const hashedPassword = await bcrypt.hash('Admin@123', 10);
  // await cache.set(`user:password:${adminUser.id}`, hashedPassword);

  console.log(`✅ 创建测试管理员用户: ${adminUser.email} (密码需手动设置)`);

  console.log('种子数据创建完成！');
}

main()
  .catch((e) => {
    console.error('种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
