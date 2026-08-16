import prisma from "../../lib/prisma.js";

const createCustomer = async (companyId, data) => {
    const customer = await prisma.customer.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            gstin: data.gstin,
            companyId,
        },
    });
    return customer;
};

const getAllCustomers = async (companyId) => {
    const customers = await prisma.customer.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
    });
    return customers;
};

const getCustomerById = async (id, companyId) => {
    const customer = await prisma.customer.findFirst({
        where: { id, companyId },
    });
    return customer;
};

const updateCustomer = async (id, companyId, data) => {
    const customer = await prisma.customer.update({
        where: { id, companyId },
        data,
    });
    return customer;
};

const deleteCustomer = async (id, companyId) => {
    await prisma.customer.delete({
        where: { id, companyId },
    });
};

export { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer };