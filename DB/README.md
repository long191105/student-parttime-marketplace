# Chợ Hời PostgreSQL

Backend dùng PostgreSQL. Flyway tự tạo các bảng và chỉ mục khi khởi động lần đầu:

- `user_accounts`: tài khoản thành viên và quản trị viên.
- `categories`: danh mục tin đăng.
- `listings`: tin đăng, trạng thái kiểm duyệt và thông tin sản phẩm.
- `listing_images`: tối đa 10 ảnh theo thứ tự hiển thị cho từng tin đăng.
- `favorites`: tin yêu thích của thành viên.

## Tạo database lần đầu

Mở PowerShell và tạo database rỗng (PostgreSQL phải đang chạy):

```powershell
psql -U postgres -c "CREATE DATABASE chohoi;"
```

Sau đó chỉnh `DB_USERNAME` và `DB_PASSWORD` trong file `.env` ở thư mục gốc. Flyway sẽ tự áp dụng toàn bộ migration trong `backend/demo/src/main/resources/db/migration`; không cần tự chạy script schema. Số điện thoại liên hệ được lưu theo từng tin và chỉ xem được khi đăng nhập.

Không dùng `ddl-auto=update` trong production. Khi thay đổi cấu trúc, thêm migration Flyway mới với số phiên bản tăng dần.
