import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('bmad API E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;

  // Test data
  const testAdmin = {
    email: `test-admin-${Date.now()}@bmad.com`,
    password: 'Test@123456',
    nickname: 'Test Admin',
  };

  const testProduct = {
    name: `Test Product ${Date.now()}`,
    description: 'Test product description',
    price: 299.99,
    stock: 100,
    categoryId: 1,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
        });
    });
  });

  describe('Authentication Flow', () => {
    it('should register a new admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/admin/register')
        .send(testAdmin)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('refreshToken');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user).toHaveProperty('email', testAdmin.email);
          authToken = res.body.data.accessToken;
        });
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          email: testAdmin.email,
          password: testAdmin.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('accessToken');
          authToken = res.body.data.accessToken;
        });
    });

    it('should fail login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/admin/login')
        .send({
          email: testAdmin.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should fail registration with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/admin/register')
        .send(testAdmin)
        .expect(409);
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('message', '登出成功');
        });
    });

    it('should fail logout without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('Product Categories', () => {
    let categoryId: number;

    it('should get all categories', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/categories')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should create a new category (authenticated)', () => {
      const newCategory = {
        name: `Test Category ${Date.now()}`,
        description: 'Test category description',
      };

      return request(app.getHttpServer())
        .post('/api/v1/products/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newCategory)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('name', newCategory.name);
          categoryId = res.body.data.id;
        });
    });

    it('should fail create category without authentication', () => {
      const newCategory = {
        name: `Test Category ${Date.now()}`,
        description: 'Test category description',
      };

      return request(app.getHttpServer())
        .post('/api/v1/products/categories')
        .send(newCategory)
        .expect(401);
    });

    it('should get a specific category', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/products/categories/1`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', 1);
        });
    });
  });

  describe('Products', () => {
    let productId: number;

    it('should get all products', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should get products with query parameters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should get a specific product', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id', 1);
        });
    });

    it('should create a new product (authenticated)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testProduct)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data).toHaveProperty('name', testProduct.name);
          productId = res.body.data.id;
        });
    });

    it('should fail create product without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .send(testProduct)
        .expect(401);
    });

    it('should publish a product (authenticated)', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/1/publish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('status', 'PUBLISHED');
        });
    });

    it('should unpublish a product (authenticated)', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/products/1/unpublish`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('status', 'UNPUBLISHED');
        });
    });

    it('should search products', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/search/results?keyword=产品&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Dashboard & Statistics', () => {
    it('should get dashboard stats (authenticated)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/dashboard/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body.data).toHaveProperty('totalUsers');
          expect(res.body.data).toHaveProperty('totalProducts');
          expect(res.body.data).toHaveProperty('totalOrders');
        });
    });

    it('should fail get dashboard stats without authentication', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/dashboard/stats')
        .expect(401);
    });

    it('should get order stats (authenticated)', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/dashboard/order-stats?days=7')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/v1/products/999999')
        .expect(404);
    });

    it('should return 400 for invalid product data', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          price: -100, // Invalid: negative price
        })
        .expect(400);
    });

    it('should return 404 for non-existent route', () => {
      return request(app.getHttpServer())
        .get('/api/v1/non-existent-route')
        .expect(404);
    });
  });

  describe('Swagger Documentation', () => {
    it('should access API documentation', () => {
      return request(app.getHttpServer())
        .get('/api/v1/docs')
        .expect(200);
    });

    it('should access Swagger JSON', () => {
      return request(app.getHttpServer())
        .get('/api/v1/docs-json')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
        });
    });
  });
});
