import prisma from "../../lib/prisma.js";

const createProduct = async (companyId, data) => {
    const product = await prisma.product.create({
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            priceType: data.priceType,
            stock: data.stock,
            ean: data.ean,
            unit: data.unit,
            tax: data.tax,
            companyId,
        },
    });

    return product;
};

const getAllProducts = async (companyId) => {
    const products = await prisma.product.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
    });
    return products;
};

const getProductById = async (id, companyId) => {
    const product = await prisma.product.findFirst({
        where: { id, companyId },
    });
    return product;
};

const updateProduct = async (id, companyId, data) => {
    const product = await prisma.product.update({
        where: { id, companyId },
        data,
    });
    return product;
};

const deleteProduct = async (id, companyId) => {
    await prisma.product.delete({
        where: { id, companyId },
    });
};

export { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct };