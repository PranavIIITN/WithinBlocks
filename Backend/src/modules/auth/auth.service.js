import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";

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

    //Step 5: return User and Company
    return {user, company};
}

export {register};