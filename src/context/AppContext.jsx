import React, { createContext, useState, useContext } from 'react';
import { appendDataToSheet } from '../services/api'; 

const AppContext = createContext();
export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
    // State user, ban đầu là null (chưa đăng nhập)
    const [currentUser, setCurrentUser] = useState(null); 
    const [pendingQuoteData, setPendingQuoteData] = useState(null); 

    const login = (role, customName) => {
        if (role === 'admin') setCurrentUser({ role: 'admin', name: customName || 'Nguyễn GĐ' });
        if (role === 'sale') setCurrentUser({ role: 'sale', name: customName || 'Trần Sale' });
        if (role === 'production') setCurrentUser({ role: 'production', name: customName || 'Lê Xưởng' });
        if (role === 'accountant') setCurrentUser({ role: 'accountant', name: customName || 'Phạm Kế Toán' });
    };

    const logout = () => setCurrentUser(null);

    const transferQuoteToOrder = (quoteData) => {
        setPendingQuoteData(quoteData);
        return true; 
    };

    const saveOrderToSheet = async (finalOrderData) => {
        try {
            const rowArray = [
                finalOrderData.orderId, new Date().toLocaleDateString(), currentUser.name,
                finalOrderData.customerType, finalOrderData.customerName, finalOrderData.phone,
                finalOrderData.address, finalOrderData.productName, finalOrderData.material,
                finalOrderData.dimensions, finalOrderData.quantity, finalOrderData.unitPrice,
                finalOrderData.totalPrice, finalOrderData.deposit, finalOrderData.remaining,
                finalOrderData.specs, finalOrderData.processing, finalOrderData.notes, "Chờ duyệt"
            ];
            await appendDataToSheet('Orders', rowArray);
            setPendingQuoteData(null); 
            return { success: true, message: "Lưu đơn hàng thành công!" };
        } catch (error) {
            console.error(error);
            return { success: false, message: error.message || "Lỗi kết nối Google Sheet!" };
        }
    };

    const saveCustomerToSheet = async (customerData) => {
        try {
            const rowArray = [
                customerData.name, customerData.totalSpent || 0, customerData.debt || 0,
                customerData.totalOrders || 0, customerData.lastTransDate || new Date().toLocaleDateString(),
                customerData.dueDate || '', customerData.type || '', customerData.remainingAmount || 0,
                customerData.status || '', customerData.paymentDate || '', customerData.notes || ''
            ];
            await appendDataToSheet('Customers', rowArray);
            return { success: true, message: "Lưu khách hàng thành công!" };
        } catch (error) {
            return { success: false, message: "Lỗi lưu khách hàng!" };
        }
    };

    const saveTransactionToSheet = async (txData) => {
        try {
            const rowArray = [
                txData.id, new Date().toLocaleDateString(), txData.category || '', txData.supplier || '',
                txData.phone || '', txData.address || '', txData.item || '', txData.quantity || 1,
                txData.unitPrice || 0, txData.totalPrice || 0, txData.paid || 0, txData.remaining || 0,
                txData.orderRef || '', txData.notes || ''
            ];
            await appendDataToSheet('Transactions', rowArray);
            return { success: true, message: "Lưu giao dịch thành công!" };
        } catch (error) {
            return { success: false, message: "Lỗi lưu giao dịch!" };
        }
    };

    return (
        <AppContext.Provider value={{ 
            currentUser, login, logout, pendingQuoteData, transferQuoteToOrder, 
            saveOrderToSheet, saveCustomerToSheet, saveTransactionToSheet 
        }}>
            {children}
        </AppContext.Provider>
    );
};