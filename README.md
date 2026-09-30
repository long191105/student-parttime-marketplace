# student-parttime-marketplace

## Auth module

Backend auth endpoints:

- `POST /api/auth/register` with `fullName`, `email`, `password`, and `role` (`STUDENT` or `EMPLOYER`)
- `POST /api/auth/login` with `email` and `password`
- `GET /api/auth/me` with `Authorization: Bearer <token>`

Passwords are stored using BCrypt. Public registration cannot create an `ADMIN` account. To initialize the first admin, set both `ADMIN_EMAIL` and `ADMIN_PASSWORD` before starting the backend; an existing non-admin account with that email is never promoted. Set `JWT_SECRET` to a private value of at least 32 bytes outside local development. Tokens expire after one hour by default; `JWT_EXPIRATION_MS` can override that value.

The frontend defaults to `http://localhost:8080/api`. Set `VITE_API_BASE_URL` when the backend uses another address. Local frontend CORS is configured for `http://localhost:5173`.





feat: Thêm chức năng mới
fix: Sửa lỗi
docs: Tài liệu
chore: Cấu hình, setup
refactor: Cải tổ code, không đổi chức năng
test: Kiểm thử