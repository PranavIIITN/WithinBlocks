import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from "./product.service.js";

const createProductController = async (req, res, next) => {
    try{
        // Get data from request body 
        const data = req.body;
        const companyId = req.user.companyId;
        
        // Pass to service
        const product = await createProduct(companyId, data);

        // Send response
        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    }
    catch (error) {
        next(error);
    }
}


const getAllProductsController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const products = await getAllProducts(companyId);
        res.status(200).json({ success: true, message: "Products fetched successfully", data: products });
    } catch (error) {
        next(error);
    }
};

const getProductByIdController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const product = await getProductById(id, companyId);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.status(200).json({ success: true, message: "Product fetched successfully", data: product });
    } catch (error) {
        next(error);
    }
};

const updateProductController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        const data = req.body;
        const product = await updateProduct(id, companyId, data);
        res.status(200).json({ success: true, message: "Product updated successfully", data: product });
    } catch (error) {
        next(error);
    }
};

const deleteProductController = async (req, res, next) => {
    try {
        const companyId = req.user.companyId;
        const { id } = req.params;
        await deleteProduct(id, companyId);
        res.status(200).json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export { createProductController, getAllProductsController, getProductByIdController, updateProductController, deleteProductController };