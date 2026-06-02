# Railway Ticket Booking Services

Repo này đã được tách lại thành nhiều NestJS project độc lập. Mỗi service có `package.json`, config TypeScript/Nest và thư mục `src` riêng.

## Services

- `api-gateway`: cổng vào hệ thống, port mặc định `3000`
- `auth-service`: đăng ký, đăng nhập, port mặc định `3001`
- `users-service`: danh sách user, profile user, port mặc định `3002`
- `search-service`: tìm chuyến tàu, port mặc định `3003`
- `tickets-service`: kiểm tra và giữ vé, port mặc định `3004`
- `orders-service`: tạo và xem order, port mặc định `3005`
- `payments-service`: tạo và xem trạng thái thanh toán, port mặc định `3006`

## Chạy một service

```bash
cd auth-service
npm install
npm run start:dev
```

Bạn có thể đổi port bằng biến môi trường:

```bash
$env:PORT=4001; npm run start:dev
```

## Build một service

```bash
cd auth-service
npm install
npm run build
```

Mỗi service hiện vẫn là API demo, chưa có database, message broker, Docker hay deploy config.
