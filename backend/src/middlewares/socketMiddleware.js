import jwt from "jsonwebtoken";
import User from "../models/User.js";
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Không tìm thấy access token"));
    }
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded) {
      return next(new Error("Token không hợp lệ hoặc đã hết hạn"));
    }
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return next(new Error("Người dùng không tồn tại"));
    }
    socket.user = user;
    next();
  } catch (error) {
    console.log("Lỗi khi verify JWT trong socketMiddleware", error);
    return next(new Error("Lỗi hệ thống"));
  }
};
