# Chợ Hời
hùng long dũng

Nền tảng rao vặt trực tuyến cho mua bán đồ cũ, đồ mới và kết nối người mua với người bán ở gần.

## Yêu cầu

- Java 21
- Node.js 20.19+ hoặc 22.12+
- PostgreSQL 15+

## Khởi tạo PostgreSQL

1. Tạo database rỗng: `psql -U postgres -c "CREATE DATABASE chohoi;"`
2. Sửa file `.env` ở thư mục gốc, điền `DB_USERNAME`, `DB_PASSWORD` và `JWT_SECRET`.
3. Có thể tạo JWT secret ngẫu nhiên trong PowerShell:

   ```powershell
   $bytes = New-Object byte[] 48
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
   [Convert]::ToBase64String($bytes)
   ```

Flyway tự tạo schema và danh mục mặc định khi backend khởi động. `.env` đã được Git bỏ qua; không commit thông tin đăng nhập.

## Chạy backend

Trong terminal PowerShell thứ nhất:

```powershell
cd backend/demo
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12.1"
.\mvnw.cmd spring-boot:run
```

Nếu JDK được cài ở đường dẫn khác, cập nhật `JAVA_HOME`. API chạy tại `http://localhost:8080`; kiểm tra backend và database tại `http://localhost:8080/api/health`.

Để khởi tạo tài khoản quản trị đầu tiên, đặt `ADMIN_EMAIL` và `ADMIN_PASSWORD` (ít nhất 12 ký tự) trong `.env` trước lần chạy đầu. Đăng ký công khai chỉ tạo tài khoản `MEMBER`. Trang quản trị được tách riêng tại `/admin` và chỉ tài khoản có quyền `ADMIN` mới truy cập được.

## Chạy frontend

Trong terminal thứ hai:

```powershell
cd frontend
npm install
npm run dev
```

Mở URL Vite hiển thị (mặc định `http://localhost:5173`). Frontend gọi API ở `http://localhost:8080/api`.

## Cấu trúc

- Backend: `backend/demo/src/main/java/com/example/demo/{controller,service,repository,model,dto,security,config}`.
- Database migration: `backend/demo/src/main/resources/db/migration`.
- Frontend: `frontend/src/{domain,data,services,components,pages}`.

API hiện hỗ trợ đăng ký/đăng nhập JWT, duyệt và tìm kiếm tin, tạo tin chờ kiểm duyệt, quản lý trạng thái tin, yêu thích, danh mục và duyệt tin dành cho quản trị viên. Số điện thoại liên hệ được lưu theo từng tin và chỉ lấy qua API cần đăng nhập; hiện chưa có xác minh OTP. Xác thực email, nhắn tin lưu trữ và báo cáo vi phạm chưa được nối backend.

## Kiểm tra

```powershell
cd backend/demo
.\mvnw.cmd test
cd ../../frontend
npm run build
npm run lint
```
