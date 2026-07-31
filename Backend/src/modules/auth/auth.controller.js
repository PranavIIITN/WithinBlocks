import {register, login} from "./auth.service.js";

const registerController = async (req, res, next) => {
    try {
        //Get data from the request body
        const {companyName, name, email, password} = req.body;

        //Pass to service
        const result = await register({companyName, name, email, password});

        //Send response
        res.status(201).json({
            success: true,
            token: result.token,
            message: "Company and account created successfully",
            data: {
                company: {
                    id: result.company.id,
                    name: result.company.name,
                },
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};

const loginController = async (req, res, next) => {
    try {
        //Get data from the request body
        const {email, password} = req.body;

        //Pass to service
        const result = await login({email, password});

        //Send response
        res.status(200).json({
            success: true,
            message: "Logged in successfully",
            data: {
                token: result.token,
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    role: result.user.role,
                },
            },
        });
    } catch(error) {
        next(error);
    }
};

export {registerController, loginController};