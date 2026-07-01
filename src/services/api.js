const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwl493XRAeWi7vGBCfXyQ4lkhWRnN1LDQiamCgVlZHQ-mNwkTSLrLUPMxQ7xan4QRMyPQ/exec";

// Hàm gọi dữ liệu (Dùng cho trang Dashboard, Đơn hàng...)
export const getDataFromSheet = async (sheetName) => {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${sheetName}`);
    const result = await response.json();
    return result;
};

// Hàm thêm dòng mới vào Google Sheets (Dùng cho Máy tính báo giá)
export const appendDataToSheet = async (sheetName, rowData) => {
    const payload = {
        action: 'append',
        data: rowData
    };

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${sheetName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status !== 'success') {
        throw new Error(result.message);
    }
    return result;
};

export const updateDataInSheet = async (sheetName, id, rowData) => {
    const payload = {
        action: 'update',
        id: id,
        data: rowData
    };

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${sheetName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status !== 'success') {
        throw new Error(result.message);
    }
    return result;
};

export const deleteDataInSheet = async (sheetName, id) => {
    const payload = {
        action: 'delete',
        id: id
    };

    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${sheetName}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (result.status !== 'success') {
        throw new Error(result.message);
    }
    return result;
};