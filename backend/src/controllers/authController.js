import { registerUser } from "../services/auth/registerService.js";
import { loginUser } from "../services/auth/loginService.js";
import Session from "../models/Session.js";
import jwt from "jsonwebtoken";
export const signUp = async (req, res) => {
  try {
    const user = await registerUser(req.body);
    return res.status(200).json({
      message: "Đăng ký thành công",
      data: user,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Lỗi server",
    });
  }
};
export const signIn = async (req, res) => {
  try {
    const { accessToken, refreshToken, user } = await loginUser(req.body);

    // set cookie ở đây
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      accessToken,
      data: user,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || "Lỗi server",
    });
  }
};
export const signOut = async (req, res) => {
  try {
    //Lấy refreshToken từ cookie
    const token = req.cookie?.refreshToken;
    if (token) {
      //xóa refresh token trong session
      await Session.deleteOne({ refreshToken: token });
      //xóa cookie
      res.clearCookie("refreshToken");
    }
    return res.sendStatus(200);
  } catch (error) {
    console.error("Lỗi khi gọi signOut", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
//tạo accesstoken mới từ cookie
export const refreshToken = async (req, res) => {
  try {
    //lấy refresh token từ cookie
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ message: "Không tìm thấy refresh token" });
    }
    //so với token trong db
    const session = await Session.findOne({ refreshToken: token });
    if (!session) {
      return res.status(401).json({ message: "Refresh token không hợp lệ" });
    }
    if (session.expiresAt < Date.now()) {
      return res.status(401).json({ message: "Refresh token hết hạn" });
    }
    //tạo access token mới
    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" },
    );
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Lỗi khi gọi refreshToken", error);
    return res.status(error.status || 500).json({ message: "Lỗi hệ thống" });
  }
};
