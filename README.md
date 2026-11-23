# Chợ Hời
hùng long dũng

Nền tảng rao vặt trực tuyến cho mua bán đồ cũ, đồ mới và kết nối người mua với người bán ở gần.

## Yêu cầu

- Java 21
- Node.js 20.19+ hoặc 22.12+
- PostgreSQL 15+

## Cấu hình database PostgreSQL

Nhóm có thể dùng chung database PostgreSQL trên Neon khi chạy ứng dụng local:

1. Mỗi thành viên sao chép `.env.example` thành `.env` ở thư mục gốc dự án.
2. Điền `DB_PASSWORD` bằng mật khẩu của database Neon; thay `JWT_SECRET` bằng secret ngẫu nhiên và `ADMIN_PASSWORD` bằng mật khẩu quản trị mạnh. Không commit hoặc gửi file `.env` lên Git.
3. Giữ nguyên `DB_URL` và `DB_USERNAME` nếu nhóm dùng đúng Neon database đã cấu hình trong template. Tất cả thành viên phải dùng cùng URL, database và thông tin đăng nhập.
4. Có thể tạo JWT secret riêng cho mỗi máy trong PowerShell:

   ```powershell
   $bytes = New-Object byte[] 48
   $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
   try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
   [Convert]::ToBase64String($bytes)
   ```

`DB_URL` mặc định dùng SSL (`sslmode=require`). Nếu muốn dùng PostgreSQL local thay vì Neon, đổi `DB_URL`, `DB_USERNAME` và `DB_PASSWORD` trong `.env`. File `.env` đã được Git bỏ qua; chỉ commit `.env.example`, không commit thông tin đăng nhập.

Khi backend khởi động, Hibernate cập nhật schema tự động (`ddl-auto=update`), nhưng không cập nhật các CHECK constraint đã tồn tại. Các thay đổi constraint cần chạy migration tương ứng trong `backend/demo/src/main/resources/db/migration`; Flyway hiện tắt mặc định (`FLYWAY_ENABLED=false`). Vì database được chia sẻ, thay đổi schema có thể ảnh hưởng các thành viên khác; không dùng database này cho dữ liệu production.

## Cấu hình xác minh email đăng ký

Đăng ký chỉ nhận địa chỉ `@gmail.com`. Backend gửi mã OTP qua Brevo Transactional Email API (HTTPS); tài khoản chỉ được tạo sau khi mã được xác minh. Mỗi mã có hiệu lực 10 phút, tối đa 5 lần nhập sai và chờ 60 giây giữa các lần gửi lại.

1. Tạo Brevo API key và xác minh địa chỉ người gửi trong Brevo.
2. Cấu hình `BREVO_API_KEY`, `BREVO_FROM_EMAIL` (địa chỉ đã xác minh) và tùy chọn `BREVO_FROM_NAME` trong `.env` hoặc biến môi trường Render. Không commit API key.
3. Khởi động lại/redeploy backend. Nếu Brevo chưa được cấu hình, đăng ký sẽ báo lỗi cấu hình gửi email; các API khác vẫn dùng được.

## Chạy backend

Trong terminal PowerShell thứ nhất:

```powershell
cd backend/demo
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12.1"
.\mvnw.cmd spring-boot:run
lệnh chạy môi trường java của hùng```
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
Set-Location "C:\Users\lenovo\student-parttime-marketplace\backend\demo"
.\mvnw.cmd spring-boot:run

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

## Triển khai backend lên Render

Frontend trên Vercel không thể gọi backend qua `localhost`; URL đó trỏ về máy của từng người truy cập. Backend Spring Boot cần được triển khai riêng và phải hỗ trợ WebSocket.

1. Trên Render, tạo **Web Service** từ repository này, chọn runtime **Docker** và đặt **Root Directory** là `backend/demo` (Render sẽ dùng `backend/demo/Dockerfile`).
2. Thêm các biến môi trường sau trong Render. Lấy thông tin database từ PostgreSQL/Neon; không dùng giá trị mẫu hoặc commit secrets:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
   - `JWT_SECRET` (secret ngẫu nhiên, đủ mạnh)
   - `CORS_ALLOWED_ORIGINS=https://chohoi.vercel.app`
   - `JPA_DDL_AUTO=update`
   - `FLYWAY_ENABLED=false`
   - Đặt `ADMIN_PASSWORD` thành mật khẩu mạnh trước khi khởi tạo tài khoản admin.
3. Sau khi deploy, kiểm tra `https://<backend-render-url>/api/health`. Sao chép URL backend dạng `https://<backend-render-url>` (không thêm `/api`).
4. Trong Vercel, mở **Settings → Environment Variables**, đặt `VITE_API_BASE_URL` thành `https://<backend-render-url>/api` cho môi trường Production, rồi redeploy frontend.

Thay `<backend-render-url>` bằng hostname Render thật. Cấu hình `BREVO_API_KEY`, `BREVO_FROM_EMAIL` và tùy chọn `BREVO_FROM_NAME` trong **Environment** của backend Render. Biến frontend `VITE_API_BASE_URL` được đóng gói lúc build nên chỉ thêm biến là chưa đủ; cần deploy lại frontend.

## Gọi thoại và video

Mở một cuộc trò chuyện trong Hộp thư rồi chọn biểu tượng điện thoại hoặc camera. Cả hai người cần đăng nhập, đang mở Hộp thư và cho phép trình duyệt truy cập micro/camera; khi chạy ngoài `localhost`, frontend cần được phục vụ qua HTTPS. Người nhận đang trực tuyến sẽ thấy và nghe thông báo cuộc gọi đến; hộp gọi hiển thị trạng thái đổ chuông, đang kết nối và các nút nhận/từ chối. Tín hiệu cuộc gọi đi qua WebSocket đã xác thực, còn âm thanh/hình ảnh truyền trực tiếp giữa hai trình duyệt bằng WebRTC. Hộp thư lưu lịch sử cuộc gọi đã kết nối (kèm thời lượng) và thông báo khi cuộc gọi bị hủy, nhỡ, từ chối, người nhận bận hoặc ngoại tuyến; các thẻ có nút gọi lại. Cuộc gọi không được ghi âm/lưu trữ.

Để gọi được giữa các mạng NAT/firewall khác nhau, cần cấu hình máy chủ TURN tương thích coturn trên backend: đặt `TURN_URLS` (ví dụ `turn:turn.example.com:3478?transport=udp,turns:turn.example.com:5349?transport=tcp`) và `TURN_SHARED_SECRET` khớp với `static-auth-secret` của coturn; tùy chọn `TURN_CREDENTIAL_TTL_SECONDS` mặc định là `3600`. Backend tạo thông tin xác thực TURN tạm thời cho người dùng đã đăng nhập nên không cần nhúng shared secret vào frontend. Sau khi cập nhật biến môi trường backend, deploy lại backend. Nếu chưa cấu hình TURN, cuộc gọi chỉ thử STUN và vẫn có thể không kết nối được trên một số mạng.

Với Metered, đặt trên backend: `TURN_URLS=turn:global.relay.metered.ca:80,turn:global.relay.metered.ca:80?transport=tcp,turn:global.relay.metered.ca:443,turns:global.relay.metered.ca:443?transport=tcp`, cùng `TURN_USERNAME` và `TURN_CREDENTIAL`. Không đặt thông tin xác thực trong frontend. Khởi động lại backend sau khi đổi biến môi trường.

## Cấu trúc

- Backend: `backend/demo/src/main/java/com/example/demo/{controller,service,repository,model,dto,security,config}`.
- Database migration: `backend/demo/src/main/resources/db/migration`.
- Frontend: `frontend/src/{domain,data,services,components,pages}`.

API hiện hỗ trợ đăng ký/đăng nhập JWT, duyệt và tìm kiếm tin, tạo tin chờ kiểm duyệt, quản lý trạng thái tin, yêu thích, danh mục, nhắn tin và tín hiệu gọi realtime, cùng duyệt tin dành cho quản trị viên. Số điện thoại liên hệ được lưu theo từng tin và chỉ lấy qua API cần đăng nhập; hiện chưa có xác minh OTP. Báo cáo vi phạm chưa được nối backend.

## Kiểm tra

```powershell
cd backend/demo
.\mvnw.cmd test
cd ../../frontend
npm run build
npm run lint
```
## Lấy Code mới 
Cách lấy code mới về 
git switch main
git pull origin main
git switch tên nhánh
git merge main





Cách commit code:
git add .
git commit -m 'nội dung'
git push
