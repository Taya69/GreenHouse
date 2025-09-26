const config = {
    ADMIN_IDS: [384072975], // Замените на ID администраторов
    DATABASE_PATH: './shop.db',
    ORDER_STATUSES: {
        CREATED: 'Создан',
        ACCEPTED: 'Принят',
        COMPLETED: 'Исполнен',
        REJECTED: 'Отклонён'
    },
    PRODUCTS_PER_PAGE: 3,
    products: [
  {
    id: 1,
    name: "Смартфон Samsung Galaxy S23",
    price: 79990,
    description: "Флагманский смартфон с камерой 200 МП, 8ГБ ОЗУ, 256ГБ ПЗУ",
    image: "https://www.ncsemena.ru/upload/iblock/085/czx9tira295l0sjgkah3ygg50i8jpz8y.jpeg",
    category: "Смартфоны",
    inStock: true
  },
  {
    id: 2,
    name: "Ноутбук Apple MacBook Air M2",
    price: 129990,
    description: "13.6-дюймовый ноутбук с чипом M2, 8ГБ ОЗУ, 256ГБ SSD",
    image: "https://www.ncsemena.ru/upload/iblock/085/czx9tira295l0sjgkah3ygg50i8jpz8y.jpeg",
    category: "Ноутбуки",
    inStock: true
  },
  {
    id: 3,
    name: "Наушники Sony WH-1000XM4",
    price: 29990,
    description: "Беспроводные наушники с шумоподавлением, до 30 часов работы",
    image: "https://www.ncsemena.ru/upload/iblock/085/czx9tira295l0sjgkah3ygg50i8jpz8y.jpeg",
    category: "Аксессуары",
    inStock: false
  },
  {
    id: 4,
    name: "Планшет iPad Air 5",
    price: 64990,
    description: "10.9-дюймовый планшет с чипом M1, поддержка Apple Pencil",
    image: "https://www.ncsemena.ru/upload/iblock/085/czx9tira295l0sjgkah3ygg50i8jpz8y.jpeg",
    category: "Планшеты",
    inStock: true
  }
],

 categories:[
   { id: 1, name: '📱 Смартфоны' },
   { id: 2, name: '💻 Ноутбуки' },
   { id: 3, name: '🎧 Гаджеты' }
]
};

export default config;