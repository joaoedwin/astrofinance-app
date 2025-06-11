"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategories = getCategories;
exports.createCategory = createCategory;
async function getCategories(userId, type) {
    const params = new URLSearchParams({ userId });
    if (type) {
        params.append("type", type);
    }
    const response = await fetch(`/api/categories?${params.toString()}`);
    if (!response.ok) {
        throw new Error("Erro ao buscar categorias");
    }
    return response.json();
}
async function createCategory(name, type) {
    const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, type }),
    });
    if (!response.ok) {
        throw new Error("Erro ao criar categoria");
    }
    return response.json();
}
