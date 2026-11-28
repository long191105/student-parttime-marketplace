# Bộ tài liệu chuẩn – Chợ Hời

**Phiên bản:** 2.0  
**Đối chiếu workspace:** 28/11/2026  
**Source of truth:** mã nguồn hiện tại, các migration và README của repository.

## Tài liệu chuẩn đang dùng

| Mã | Tệp | Mục đích |
|---|---|---|
| 01 | `01_SRS_Cho_Hoi_v2.0.docx` | Yêu cầu chức năng/phi chức năng, trạng thái code, quy tắc nghiệp vụ và giới hạn. |
| 02 | `02_Kien_truc_He_thong_v2.0.docx` | Kiến trúc container, security, realtime, API surface, deployment và ADR/risks. |
| 03 | `03_Thiet_ke_API_CSDL_v2.0.docx` | Từ điển dữ liệu, cardinality, state lifecycle, API inventory và migration. |
| 04 | `04_Huong_dan_Van_hanh_Su_dung_v2.0.docx` | Cài local, cấu hình dịch vụ, hướng dẫn người dùng/quản trị, troubleshooting. |
| 05 | `05_Truy_vet_Yeu_cau_Kiem_thu_v2.0.xlsx` | FR-to-test trace, test execution chưa chạy, config/release checklist. |
| 06 | `06_Bao_cao_tien_do_Hien_trang_v2.0.pptx` | Slide tổng quan hiện trạng; không chứa số liệu demo bịa đặt. |
| 07 | `07_Bao_cao_do_an_Cho_Hoi.docx` | Báo cáo đồ án theo mẫu Chuyên đề tốt nghiệp 2. |
| D1–D4 | `diagrams/*.drawio` | Architecture, business flow, ERD, UI sitemap; nguồn chỉnh sửa diagrams.net. |

## Quy tắc trạng thái

- **Có trong mã nguồn:** module/endpoint/model hiện diện; không khẳng định môi trường production đang chạy.
- **Phụ thuộc cấu hình:** cần dịch vụ/credential/HTTPS/TURN để demo.
- **Đề xuất/chưa xác minh:** tiêu chí nghiệm thu hoặc NFR chưa có bằng chứng đo.
- Test workbook mặc định `Chưa chạy`. Không đổi sang Pass khi chưa có actual result/evidence.

## Phát hiện cần xử lý trước khi phát hành

`backend/demo/src/main/resources/application.properties` chứa fallback credential không an toàn được track trong source. Không sao chép giá trị đó vào tài liệu. Trước khi chia sẻ/triển khai: rotate credential liên quan, xóa fallback, yêu cầu cấu hình từ environment/secret manager, và xác nhận lịch sử git/secret exposure theo quy trình nhóm.

Các tích hợp Brevo, Google, Cloudinary và TURN cần cấu hình riêng. Flyway có migration V1–V21 trong repository nhưng cấu hình mặc định hiện tắt Flyway và bật JPA schema update; phải chọn chiến lược migration có kiểm soát cho production.

## Lịch sử tài liệu

Các tài liệu buổi 2/3/4/5, sơ đồ và slide giữa kỳ trước được lưu nguyên bản dưới `archive/legacy_2026-11-28/` để truy vết. Nội dung lịch sử đó có yêu cầu/tiến độ không còn khớp; không dùng làm đặc tả hiện hành nếu chưa được đối chiếu.

## Cập nhật khi source thay đổi

Sau thay đổi lớn về entity/API/security: cập nhật ERD, SRS trace matrix, endpoint inventory, test cases và README; cập nhật ngày/version; ghi evidence thực tế. Không dùng `.env` làm tài liệu và không commit secret.
