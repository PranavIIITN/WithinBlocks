import { getCompany, updateCompany } from "./company.service.js";

const getCompanyController = async (req, res, next) => {
    try {
        const { companyId } = req.user;
        const company = await getCompany(companyId);
        res.status(200).json({ success: true, message: "Company fetched successfully", data: company });
    } catch (error) {
        next(error);
    }
};

const updateCompanyController = async (req, res, next) => {
    try {
        const { companyId } = req.user;
        const company = await updateCompany(companyId, req.body);
        res.status(200).json({ success: true, message: "Company updated successfully", data: company });
    } catch (error) {
        next(error);
    }
};

export { getCompanyController, updateCompanyController };