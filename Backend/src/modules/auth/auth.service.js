import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import {generateToken} from "../../utils/jwt.js";

const register = async ({companyName, name, email, password}) => {
    
    //Step 1: Check if email already exists
    const existingUser = await prisma.user.findUnique({where : {email}});
    if(existingUser) {
        const error = new Error("email already in use");
        error.statusCode = 409;
        throw error;
    }

    //Step 2: Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Step 3 & 4: Creating the user and the company together
    const company = await prisma.company.create({
        data: {
            name: companyName,
            email,
            users: {
                create: {
                    name,
                    email,
                    password: hashedPassword,
                    role: "OWNER",
                    isActive: true,
                },
            },
        },
        include: {users : true},
    });

    const user = company.users[0];

    //Step 5 Generating JWT token
    const token = generateToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
    });


    //Step 6: return User and Company
    return {token, user, company};
}

const login = async ({email, password}) => {
    
    //Step 1 Checking if user exists
    const user = await prisma.user.findUnique({where : {email}});
    if(!user) {
        const error = new Error("User does not exist");
        error.statusCode = 401;
        throw error;
    }

    //Step 2 Check if user is active
    if(!user.isActive) {
        const error = new Error("User is not active");
        error.statusCode = 401;
        throw error;
    }

    //Step 3 Comparing the password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        const error = new Error("Incorrect Password");
        error.statusCode = 401;
        throw error;
    }

    
    //Step 4 Generating JWT token
    const token = generateToken({
        userId: user.id,
        companyId: user.companyId,
        role: user.role,
    });

    return {token, user};

}

export {register, login};