import { useState } from 'react';
import { Calculator, ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const UVDTFCalculator = () => {
  const { currentUser } = useAppContext();
  const isAdmin = currentUser?.role === 'admin';
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerType, setCustomerType] = useState('khach_le');

  const [result, setResult] = useState(null);

  const calculateLayout = () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    const qty = parseInt(quantity);

    if (!w || !h || !qty) {
      alert('Vui lòng nhập đầy đủ Kích thước và Số lượng!');
      return;
    }

    // Minimum vertical spacing is 4mm = 0.4cm.
    // Minimum horizontal spacing is 2mm = 0.2cm (allowed to squeeze more into 58cm)
    // Roll width max constraint is 58.2cm if considering spacing.
    // Formula: cols = floor(58.2 / (width + 0.2))
    
    // Phương án 1: Giữ nguyên chiều (Upright)
    const cols1 = Math.floor(58.2 / (w + 0.2));
    const rows1 = cols1 > 0 ? Math.ceil(qty / cols1) : Infinity;
    const length1 = rows1 * (h + 0.4);

    // Phương án 2: Xoay 90 độ (Rotated)
    const cols2 = Math.floor(58.2 / (h + 0.2));
    const rows2 = cols2 > 0 ? Math.ceil(qty / cols2) : Infinity;
    const length2 = rows2 * (w + 0.4);

    let finalCols, finalRows, finalLengthCm, isRotated;
    
    if (cols1 === 0 && cols2 === 0) {
      alert('Kích thước tem quá lớn, không vừa khổ 58cm!');
      return;
    }

    if (length1 <= length2 && cols1 > 0) {
      finalCols = cols1;
      finalRows = rows1;
      finalLengthCm = length1;
      isRotated = false;
    } else {
      finalCols = cols2;
      finalRows = rows2;
      finalLengthCm = length2;
      isRotated = true;
    }

    const finalLengthMeter = finalLengthCm / 100;

    // Áp dụng bảng giá
    let unitPrice = 0;
    if (customerType === 'ALI') {
      if (finalLengthMeter <= 3) unitPrice = 180000;
      else if (finalLengthMeter <= 10) unitPrice = 150000;
      else if (finalLengthMeter <= 50) unitPrice = 145000;
      else if (finalLengthMeter <= 100) unitPrice = 140000;
      else if (finalLengthMeter <= 300) unitPrice = 135000;
      else unitPrice = 130000;
    } else if (customerType === 'ChienLuu') {
      if (finalLengthMeter <= 3) unitPrice = 180000;
      else if (finalLengthMeter <= 10) unitPrice = 165000;
      else if (finalLengthMeter <= 50) unitPrice = 155000;
      else if (finalLengthMeter <= 100) unitPrice = 145000;
      else if (finalLengthMeter <= 300) unitPrice = 140000;
      else unitPrice = 135000;
    } else {
      // Khách lẻ
      if (finalLengthMeter <= 3) unitPrice = 280000;
      else if (finalLengthMeter <= 10) unitPrice = 250000;
      else if (finalLengthMeter <= 50) unitPrice = 220000;
      else if (finalLengthMeter <= 100) unitPrice = 210000;
      else if (finalLengthMeter <= 300) unitPrice = 200000;
      else unitPrice = 180000;
      
      // Giảm 15% cho khách lẻ theo yêu cầu
      unitPrice = unitPrice * 0.85;
    }

    const totalPrice = finalLengthMeter * unitPrice;

    setResult({
      cols: finalCols,
      rows: finalRows,
      lengthCm: finalLengthCm,
      lengthM: finalLengthMeter,
      isRotated,
      unitPrice,
      totalPrice
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="h1" style={{ margin: 0 }}>Máy Tính Tem UV-DTF</h1>
      </div>

      <div className="responsive-grid">
        {/* CỘT NHẬP LIỆU */}
        <div className="card">
          <h2 className="h3" style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Thông Số Tem</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Chiều Ngang (cm)</label>
              <input type="number" className="form-input" value={width} onChange={e => setWidth(e.target.value)} placeholder="VD: 5" />
            </div>
            <div className="form-group">
              <label className="form-label">Chiều Dọc (cm)</label>
              <input type="number" className="form-input" value={height} onChange={e => setHeight(e.target.value)} placeholder="VD: 5.77" />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Số Lượng (tem)</label>
            <input type="number" className="form-input" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="VD: 44" />
          </div>

          {isAdmin && (
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Loại Khách Hàng</label>
              <select className="form-input" value={customerType} onChange={e => setCustomerType(e.target.value)}>
                <option value="khach_le">Khách lẻ (Giảm 15%)</option>
                <option value="ALI">Khách ALI</option>
                <option value="ChienLuu">Khách ChienLuu</option>
              </select>
            </div>
          )}

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: isAdmin ? 0 : '1.5rem' }} onClick={calculateLayout}>
            <Calculator size={18} /> {isAdmin ? 'Tối Ưu & Tính Giá' : 'Tính Tối Ưu Xếp Tem'}
          </button>
        </div>

        {/* CỘT KẾT QUẢ */}
        {result && (
          <div className="card" style={{ backgroundColor: '#f8fafc', border: '2px dashed var(--primary)' }}>
            <h2 className="h3" style={{ marginBottom: '1.5rem', color: 'var(--success)' }}>Kết Quả Tối Ưu Khổ 58cm</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phương án xếp:</span>
                <strong>{result.isRotated ? 'Xoay 90 độ' : 'Giữ nguyên chiều dọc'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số lượng tem/hàng:</span>
                <strong>{result.cols} tem / hàng</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Số hàng chạy dài:</span>
                <strong>{result.rows} hàng</strong>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Đơn giá áp dụng:</span>
                  <strong>{new Intl.NumberFormat('vi-VN').format(result.unitPrice)} đ / mét</strong>
                </div>
              )}
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Tổng số mét dài</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {result.lengthM.toFixed(4)} <span style={{ fontSize: '1.5rem' }}>m</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>({result.lengthCm.toFixed(2)} cm)</div>
              </div>

              {isAdmin && (
                <>
                  <div style={{ borderTop: '1px dashed var(--border)', margin: '1rem 0' }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>TỔNG TIỀN:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                      {new Intl.NumberFormat('vi-VN').format(Math.round(result.totalPrice))} đ
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {isAdmin && customerType === 'khach_le' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                * Đơn giá đã bao gồm chiết khấu giảm 15% cho Khách lẻ
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UVDTFCalculator;
