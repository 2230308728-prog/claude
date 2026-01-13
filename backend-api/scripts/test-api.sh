#!/bin/bash

# bmad API 测试脚本
# 用于快速验证所有 API 端点是否正常工作

BASE_URL="http://localhost:3000/api/v1"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  bmad API 测试脚本"
echo "=========================================="
echo ""

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local auth=$5

    echo -n "测试: $name ... "

    if [ -n "$auth" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $auth" \
            -d "$data" \
            -w "\n%{http_code}")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\n%{http_code}")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  响应: $body"
        ((FAILED++))
    fi
}

echo "1. 公共 API 测试"
echo "----------------------------------------"
test_api "健康检查" "GET" "/health" "" ""
test_api "获取产品列表" "GET" "/products" "" ""
test_api "获取产品分类" "GET" "/products/categories" "" ""
test_api "获取推荐产品" "GET" "/products/1" "" ""

echo ""
echo "2. 认证 API 测试"
echo "----------------------------------------"

# 管理员登录
echo -n "测试: 管理员登录 ... "
login_response=$(curl -s -X POST "$BASE_URL/auth/admin/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@bmad.com","password":"Admin@123"}')

access_token=$(echo $login_response | jq -r '.data.accessToken // empty')

if [ -n "$access_token" ] && [ "$access_token" != "null" ]; then
    echo -e "${GREEN}✓ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAILED${NC}"
    echo "  响应: $login_response"
    ((FAILED++))
fi

if [ -n "$access_token" ] && [ "$access_token" != "null" ]; then
    echo ""
    echo "3. 需要认证的 API 测试"
    echo "----------------------------------------"
    test_api "获取用户列表" "GET" "/users" "" "$access_token"
    test_api "获取 Dashboard 统计" "GET" "/users/dashboard/stats" "" "$access_token"
    test_api "获取订单统计" "GET" "/users/dashboard/order-stats" "" "$access_token"

    echo ""
    echo "4. 产品管理 API 测试"
    echo "----------------------------------------"
    test_api "发布产品" "POST" "/products/1/publish" "" "$access_token"

    echo ""
    echo "5. 退出登录"
    echo "----------------------------------------"
    test_api "退出登录" "POST" "/auth/logout" "" "$access_token"
fi

echo ""
echo "=========================================="
echo "  测试结果汇总"
echo "=========================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo "总计: $((PASSED + FAILED))"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}所有测试通过！${NC}"
    exit 0
else
    echo -e "${RED}有测试失败，请检查！${NC}"
    exit 1
fi
