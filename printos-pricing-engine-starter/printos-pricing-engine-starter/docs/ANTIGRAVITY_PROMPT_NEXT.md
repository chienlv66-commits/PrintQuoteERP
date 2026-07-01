Bạn đang phát triển web app PrintOS. Hãy dùng thư mục `printos-pricing-engine-starter` làm nền tảng.

Mục tiêu trước mắt:
1. Tích hợp source vào backend Node.js/Express hiện có.
2. Tạo endpoint `POST /api/quotes/calculate`.
3. Tạo trang Admin Test Pricing trong React.
4. Form gồm: productType, quantity, widthCm, heightCm, materialId, sideCount, laminate, cut, drill, finishingType.
5. Khi role=admin hoặc sale, hiển thị đầy đủ breakdown và alternatives.
6. Khi role=customer, chỉ hiển thị unitPrice, totalPrice, note.
7. Dữ liệu giấy phải lấy từ database hoặc seed JSON, không hardcode trong công thức.
8. Luôn chọn phương án rẻ nhất nếu finishingType = auto.
9. Giữ cấu trúc module để sau này bổ sung quick_decal, void, tem_cn, mica, leather_tag, uv_dtf, dtf_ao, hop_giay, tui_giay.

Không thay đổi logic chính nếu chưa có test so sánh với Excel.
