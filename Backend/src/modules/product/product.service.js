import prisma from "../../lib/prisma.js";

const createProduct = async (companyId, data) => {
    const product = await prisma.product.create({
        data: {
            name: data.name,
            description: data.description,
            price: data.price,
            stock: data.stock,
            ean: data.ean,
            unit: data.unit,
            tax: data.tax,
            companyId,
        },
    });

    return product;
};

export { createProduct };