import {register, login, requestPasswordReset, resetPassword} from "./auth.service.js";
import { forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas.js";

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

const forgotPasswordController = async (req, res, next) => {
    try {
        const parsed = forgotPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        }

        await requestPasswordReset(parsed.data.email);

        // Identical response whether or not the email exists, is active, or
        // the send even succeeded — see auth.service.js for why. This line
        // must never become conditional on anything requestPasswordReset did.
        res.status(200).json({
            success: true,
            message: "If an account exists with that email, we've sent a password reset link.",
        });
    } catch (error) {
        next(error);
    }
};

const resetPasswordController = async (req, res, next) => {
    try {
        const parsed = resetPasswordSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, message: parsed.error.issues[0].message });
        }

        await resetPassword(parsed.data);

        res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now sign in with your new password.",
        });
    } catch (error) {
        next(error);
    }
};

export {registerController, loginController, forgotPasswordController, resetPasswordController};