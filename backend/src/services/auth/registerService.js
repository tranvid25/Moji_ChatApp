import bcrypt from "bcrypt";
import User from "../../models/User.js";


export const registerUser = async (data) => {
    const { username, password, email, firstname, lastname } = data;

    // check duplicate
    const existingUser = await User.findOne({ username });
    if (existingUser) {
        throw {
            status: 409,
            message: "Username đã tồn tại"
        };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
        username,
        password: hashedPassword,
        email,
        displayName: `${firstname} ${lastname}`
    });
    const newUser = await User.findById(user._id).select("-password");
    return newUser;
};