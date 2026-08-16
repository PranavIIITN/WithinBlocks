import { createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer } from "./customer.service.js";

const createCustomerController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const data = req.body;
        const customer = await createCustomer(companyId, data);
        res.status(201).json({ success: true, message: "Customer created successfully", data: customer });
    } catch (error) {
        next(error);
    }
};

const getAllCustomersController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const customers = await getAllCustomers(companyId);
        res.status(200).json({ success: true, message: "Customers fetched successfully", data: customers });
    } catch (error) {
        next(error);
    }
};

const getCustomerByIdController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const customer = await getCustomerById(id, companyId);
        if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });
        res.status(200).json({ success: true, message: "Customer fetched successfully", data: customer });
    } catch (error) {
        next(error);
    }
};

const updateCustomerController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const data = req.body;
        const customer = await updateCustomer(id, companyId, data);
        res.status(200).json({ success: true, message: "Customer updated successfully", data: customer });
    } catch (error) {
        next(error);
    }
};

const deleteCustomerController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        await deleteCustomer(id, companyId);
        res.status(200).json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { createCustomerController, getAllCustomersController, getCustomerByIdController, updateCustomerController, deleteCustomerController };