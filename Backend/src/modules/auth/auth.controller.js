import {register, login} from "./auth.service.js";

const registerController = async (req, res, next) => {
    try {
        //Get data from the request body
        const {companyName, state, name, email, password} = req.body;

        //Pass to service
        const result = await register({companyName, state, name, email, password});

        //Send response
        res.status(201).json({
            success: true,
            message: "Company and account created successfully",
            data: {
                token: result.token,
                company: {
                    id: result.company.id,
                    name: result.company.name,
                    state: result.company.state,
                    gstin: result.company.gstin,
                    address: result.company.address,
                    phone: result.company.phone,
                    logo: result.company.logo,
                    signature: result.company.signature,
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
                company: {
                    id: result.user.company.id,
                    name: result.user.company.name,
                    state: result.user.company.state,
                    gstin: result.user.company.gstin,
                    address: result.user.company.address,
                    phone: result.user.company.phone,
                    logo: result.user.company.logo,
                    signature: result.user.company.signature,
                },
            },
        });
    } catch(error) {
        next(error);
    }
};

export {registerController, loginController};