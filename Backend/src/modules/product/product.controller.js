import {createProduct} from "./product.service.js";

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

export{ createProductController };