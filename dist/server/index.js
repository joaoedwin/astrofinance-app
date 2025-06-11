"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../lib/db");
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
app.use(express_1.default.json());
// Rota para obter categorias
app.get('/api/categories', async (req, res) => {
    try {
        const db = await (0, db_1.getDatabase)();
        const categories = await db.all('SELECT * FROM categories ORDER BY name');
        res.json(categories);
    }
    catch (error) {
        console.error('Erro ao buscar categorias:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
// Rota para criar categoria
app.post('/api/categories', async (req, res) => {
    try {
        const { name, type, userId } = req.body;
        const db = await (0, db_1.getDatabase)();
        const result = await db.run('INSERT INTO categories (id, name, type, user_id) VALUES (?, ?, ?, ?)', [crypto.randomUUID(), name, type, userId]);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Erro ao criar categoria:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});
