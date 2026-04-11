import { verifyToken } from "../utils/jwt.js";

const authenticate = (req, res, next) => {

    //Step 1 Get token from the header
    const authHeader = req.headers.authorization;
    console.log("authHeader: ", authHeader);

    //Step 2 Check if token exists
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "No token provided" });
    }

    //Step 3 Extract token
    const token = authHeader.split(" ")[1];

    //Step 4 Verify token
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
};

const authorizeOwner = (req, res, next) => {
    if(req.user.role != "OWNER") {
        return res.status(403).json({
            success: false,
            message: "Forbidden - Owner access only"
        });
    }

    next();
};

export { authenticate, authorizeOwner };