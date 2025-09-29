import config from '../config.js';
// import * as config from 'dotenv';
// config.config();

export function isAdmin(userId) {
    // console.log(process.env.ADMIN_IDS);
    return config.ADMIN_IDS.includes(userId);
}

export function formatPrice(price) {
    return `${price} руб.`;
}



export function getOrderStatusText(status) {
    const statusMap = {
        'created': 'Создан',
        'accepted': 'Принят', 
        'completed': 'Исполнен',
        'rejected': 'Отклонён',
        'cancelled': 'Отменён'
    };
    return statusMap[status] || status;
}