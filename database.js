import Database from 'better-sqlite3';
// import { formatIncompletePhoneNumber } from 'libphonenumber-js';
// const config = require('./config');
// import * as config from './config.js';
import config from './config.js';

class ShopDatabase {
    constructor() {
        this.db = new Database(config.DATABASE_PATH);
        this.initDatabase();
    }

    initDatabase() {
        // Включаем foreign keys
        this.db.pragma('foreign_keys = ON');

        // Таблица пользователей
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER UNIQUE,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                phone TEXT,
                full_name TEXT,
                is_admin BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        `);

        // Таблица товаров
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,                
                image_url TEXT,
                stock INTEGER DEFAULT 0,
                is_available BOOLEAN DEFAULT TRUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
            )
        `);

        // Таблица корзины
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                product_id INTEGER,
                quantity INTEGER DEFAULT 1,
                added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
                UNIQUE(user_id, product_id)
            )
        `);

        // Таблица заказов
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                total_amount REAL,
                status TEXT DEFAULT 'created',
                admin_comment TEXT DEFAULT '',
                user_comment TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `);

        // Таблица элементов заказа
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER,
                product_id INTEGER,
                quantity INTEGER,
                price REAL,
                FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
            )
        `);

        this.prepareStatements();
    }

    prepareStatements() {
        this.stmts = {
            // User statements
            getUser: this.db.prepare('SELECT * FROM users WHERE telegram_id = ?'),
            getUserById: this.db.prepare('SELECT * FROM users WHERE id = ?'),
            getUsers: this.db.prepare('SELECT * FROM users'),
            createUser: this.db.prepare(`
                INSERT OR IGNORE INTO users (telegram_id, username, first_name, last_name) 
                VALUES (?, ?, ?, ?)
            `),
            updateUserContact: this.db.prepare(`
                UPDATE users SET phone = ?, full_name = ? WHERE telegram_id = ?
            `),
            getUserContactInfo: this.db.prepare('SELECT phone, full_name FROM users WHERE telegram_id = ?'),
            
            // Product statements
            getProducts: this.db.prepare(`
                SELECT p.*, c.name AS category_name 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.is_available = TRUE 
                AND (p.category_id = ? OR ? IS NULL)
                ORDER BY p.created_at ASC
            `),
            getProductsAny: this.db.prepare(`
                SELECT p.*, c.name AS category_name 
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE (p.category_id = ? OR ? IS NULL)
                ORDER BY p.created_at ASC
            `),
            getAllProducts: this.db.prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at ASC'),
            getAllAvailableProducts: this.db.prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_available = TRUE ORDER BY p.created_at ASC'),
            getProductById: this.db.prepare('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ? AND p.is_available = TRUE'),
            addProduct: this.db.prepare(`
                INSERT INTO products (name, description, price, category_id, image_url, stock) 
                VALUES (?, ?, ?, ?, ?, ?)
            `),
            deleteProduct: this.db.prepare('DELETE FROM products WHERE id = ?'),
            updateProduct: this.db.prepare(`
                UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, 
                image_url = ?, stock = ?, is_available = ? WHERE id = ?
            `),
            updateProductStock: this.db.prepare(`
                UPDATE products SET stock = ? WHERE id = ?
            `),
            
            // Cart statements
            getCart: this.db.prepare(`
                SELECT c.*, p.name, p.price, p.image_url, p.stock 
                FROM cart c 
                JOIN products p ON c.product_id = p.id 
                WHERE c.user_id = ?
            `),
            getCartItem: this.db.prepare('SELECT * FROM cart WHERE user_id = ? AND product_id = ?'),
            addToCart: this.db.prepare(`
                INSERT INTO cart (user_id, product_id, quantity) 
                VALUES (?, ?, 1) 
                ON CONFLICT(user_id, product_id) 
                DO UPDATE SET quantity = quantity + 1
            `),
            removeFromCart: this.db.prepare('DELETE FROM cart WHERE user_id = ? AND product_id = ?'),
            clearCart: this.db.prepare('DELETE FROM cart WHERE user_id = ?'),
            updateCartQuantity: this.db.prepare('UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?'),
            
            // Order statements
            createOrder: this.db.prepare(`
                INSERT INTO orders (user_id, total_amount, user_comment) 
                VALUES (?, ?, ?)
            `),
            createOrderItem: this.db.prepare(`
                INSERT INTO order_items (order_id, product_id, quantity, price) 
                VALUES (?, ?, ?, ?)
            `),
            getUserOrders: this.db.prepare(`
                SELECT o.* 
                FROM orders o 
                WHERE o.user_id = ? 
                ORDER BY o.created_at ASC
            `),
            getAllOrders: this.db.prepare(`
                SELECT o.*, u.first_name, u.username, u.phone 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                ORDER BY o.created_at ASC
            `),
            getOrdersByStatus: this.db.prepare(`
                SELECT o.*, u.first_name, u.username, u.phone 
                FROM orders o 
                JOIN users u ON o.user_id = u.id 
                WHERE o.status = ?
                ORDER BY o.created_at ASC
            `),
            getOrderById: this.db.prepare('SELECT * FROM orders WHERE id = ?'),
            getOrderDetails: this.db.prepare(`
                SELECT oi.*, p.name, p.image_url 
                FROM order_items oi 
                JOIN products p ON oi.product_id = p.id 
                WHERE oi.order_id = ?
            `),
            updateOrderStatus: this.db.prepare(`
                UPDATE orders SET status = ?, admin_comment = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `),
            updateOrderUserComment: this.db.prepare('UPDATE orders SET user_comment = ? WHERE id = ?'),
            getOrderStats: this.db.prepare(`
                SELECT 
                COUNT(*) as total_orders,
                SUM(total_amount) as total_revenue,
                AVG(total_amount) as avg_order_value,
                COUNT(DISTINCT user_id) as total_customers,
                status,
                COUNT(*) as status_count
                FROM orders 
                GROUP BY status
            `),
            // SQL-запросы для работы с категориями
            getCategories: this.db.prepare(
                'SELECT * FROM Categories'
            ),
            getCategoryById: this.db.prepare(
                'SELECT * FROM Categories WHERE id = ?'
            ),
            addProductCategory: this.db.prepare(
                'INSERT INTO Categories (name) VALUES (?)'
            ),
            updateCategory: this.db.prepare(
                'UPDATE Categories SET name = ? WHERE id = ?'
            ),
            deleteCategory: this.db.prepare(
                'DELETE FROM Categories WHERE id = ?'
            ),
            getAdmins: this.db.prepare('SELECT * FROM users WHERE is_admin = TRUE')
        };
    }

    // Методы для работы с пользователями
    getUser(telegramId) {
        return this.stmts.getUser.get(telegramId);
    }
    getUserById(Id) {
        return this.stmts.getUserById.get(Id);
    }
    getUsers() {
        return this.stmts.getUsers.all();
    }

    createUser(userData) {
        const result = this.stmts.createUser.run(
            userData.id, 
            userData.username, 
            userData.first_name, 
            userData.last_name
        );
        return result.lastInsertRowid;
    }

    updateUserContact(telegramId, phone, fullName) {
        const result = this.stmts.updateUserContact.run(phone, fullName, telegramId);
        return result.changes;
    }

    getUserContactInfo(telegramId) {
        return this.stmts.getUserContactInfo.get(telegramId);
    }

    // Методы для работы с товарами
    getProducts(category) {
        // return this.stmts.getAllProducts.all();
        if (category === 0 || category === null) {
            return this.stmts.getAllAvailableProducts.all();
        }
        return this.stmts.getProducts.all(category, category);
    }

    getProductsAny(category) {
        if (category === 0 || category === null) {
            return this.stmts.getAllProducts.all();
        }
        return this.stmts.getProductsAny.all(category, category);
    }

    getAllProducts() {
        return this.stmts.getAllProducts.all();
    }

    getProductById(productId) {
        return this.stmts.getProductById.get(productId);
    }

    addProduct(productData) {
        const result = this.stmts.addProduct.run(
            productData.name,
            productData.description,
            productData.price,
            productData.category_id,
            productData.image_url,
            productData.stock
        );
        return result.lastInsertRowid;
    }

    deleteProduct(productId) {
        const result = this.stmts.deleteProduct.run(productId);
        return result.changes;
    }

    updateProductStock(productId, newStock) {
        const result = this.stmts.updateProductStock.run(newStock, productId);
        return result.changes;
    }

    // Методы для работы с корзиной
    getCart(userId) {
        return this.stmts.getCart.all(userId);
    }

    getCartItem(userId, productId) {
        return this.stmts.getCartItem.get(userId, productId);
    }

    addToCart(userId, productId) {
        const result = this.stmts.addToCart.run(userId, productId);
        return result.changes;
    }

    removeFromCart(userId, productId) {
        const result = this.stmts.removeFromCart.run(userId, productId);
        return result.changes;
    }

    clearCart(userId) {
        const result = this.stmts.clearCart.run(userId);
        return result.changes;
    }

    updateCartQuantity(userId, productId, quantity) {
        const result = this.stmts.updateCartQuantity.run(quantity, userId, productId);
        return result.changes;
    }

    // Методы для работы с заказами
    createOrder(userId, items, totalAmount, userComment = '') {
        return this.db.transaction(() => {
            // Создаем заказ
            const orderResult = this.stmts.createOrder.run(userId, totalAmount, userComment);
            const orderId = orderResult.lastInsertRowid;

            // Добавляем элементы заказа
            for (const item of items) {
                this.stmts.createOrderItem.run(
                    orderId,
                    item.product_id,
                    item.quantity,
                    item.price
                );
            }

            return orderId;
        })();
    }

    getUserOrders(userId) {
        return this.stmts.getUserOrders.all(userId);
    }

    getAllOrders() {
        return this.stmts.getAllOrders.all();
    }

    getOrdersByStatus(status) {
        return this.stmts.getOrdersByStatus.all(status);
    }

    getOrderById(orderId) {
        return this.stmts.getOrderById.get(orderId);
    }

    getOrderDetails(orderId) {
        return this.stmts.getOrderDetails.all(orderId);
    }

    updateOrderStatus(orderId, status, adminComment = '') {
        const result = this.stmts.updateOrderStatus.run(status, adminComment, orderId);
        return result.changes;
    }

    updateOrderUserComment(orderId, userComment) {
        const result = this.stmts.updateOrderUserComment.run(userComment, orderId);
        return result.changes;
    }

    getOrderStats() {
        return this.stmts.getOrderStats.all();
    }

    // Методы для работы с категориями
    getProductCategories() {
        return this.stmts.getCategories.all();
    }
    getProductCategoryById(categoryId) {
        return this.stmts.getCategoryById.get(categoryId);
    }

    addProductCategory(categoryData) {
        const result = this.stmts.addProductCategory.run(categoryData.name);
        return result.lastInsertRowid;
    }

    updateProductCategory(categoryId, name) {
        const result = this.stmts.updateCategory.run(name, categoryId);
        return result.changes;
    }

    deleteProductCategory(categoryId) {
        const result = this.stmts.deleteCategory.run(categoryId);
        return result.changes;
    }

    getAdmins() {
        return this.stmts.getAdmins.all();
    }

    close() {
        this.db.close();
    }
}

export default new ShopDatabase();