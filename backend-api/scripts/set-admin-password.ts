import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function setAdminPassword(email: string, password: string) {
  try {
    // 查找管理员用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`用户 ${email} 不存在`);
      process.exit(1);
    }

    if (user.role !== 'ADMIN') {
      console.error(`用户 ${email} 不是管理员`);
      process.exit(1);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 将密码存储到 Redis (这里直接用 console.log 显示，实际需要连接 Redis)
    console.log('='.repeat(60));
    console.log('管理员密码设置成功！');
    console.log('='.repeat(60));
    console.log(`邮箱: ${email}`);
    console.log(`用户ID: ${user.id}`);
    console.log(`加密后的密码 (存储到 Redis key: user:password:${user.id}):`);
    console.log(hashedPassword);
    console.log('='.repeat(60));
    console.log('');
    console.log('请将上述哈希值存储到 Redis 中:');
    console.log(`  key: user:password:${user.id}`);
    console.log(`  value: ${hashedPassword}`);
    console.log('');
    console.log('或者使用 Redis CLI:');
    console.log(`  redis-cli SET "user:password:${user.id}" "${hashedPassword}"`);
    console.log('='.repeat(60));

    // 如果有 Redis 连接，可以直接设置
    // await cache.set(`user:password:${user.id}`, hashedPassword);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('设置密码失败:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// 从命令行参数获取邮箱和密码
const email = process.argv[2] || 'admin@bmad.com';
const password = process.argv[3] || 'Admin@123';

setAdminPassword(email, password);
