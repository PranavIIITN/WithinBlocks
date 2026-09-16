import prisma from "../../lib/prisma.js";

const getCompany = async (companyId) => {
    return prisma.company.findUnique({ where: { id: companyId } });
};

const updateCompany = async (companyId, data) => {
    return prisma.company.update({
        where: { id: companyId },
        data: {
            name: data.name,
            phone: data.phone,
            address: data.address,
            gstin: data.gstin,
            state: data.state,
            invoicePrefix: data.invoicePrefix,
            financialYear: data.financialYear,
        },
    });
};

export { getCompany, updateCompany };