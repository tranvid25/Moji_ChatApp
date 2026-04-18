import User from "../../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import Session from "../../models/Session.js";
const ACCESS_TOKEN_TTL='30m';
const REFRESH_TOKEN_TTL=14*24*60*60*1000;
export const loginUser = async (data) => {
    const { username, password } = data;

    const user = await User.findOne({ username });
    if (!user) {
        throw {
            status: 401,
            message: "username hoặc password không chính xác"
        };
    }

    const passwordCorrect = await bcrypt.compare(password, user.password);
    if (!passwordCorrect) {
        throw {
            status: 401,
            message: "username hoặc password không chính xác"
        };
    }

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_TTL }
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    await Session.create({
        userId: user._id,
        refreshToken,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL)
    });

    const { password: _, ...userData } = user._doc;

    return {
        accessToken,
        refreshToken,
        user: userData
    };
};