import rateLimit, { ipKeyGenerator } from "express-rate-limit";

// Rate limit cho tin nhắn loại "location"
export const locationRateLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 giây
  max: 1, // Tối đa 1 lần / windowMs
  keyGenerator: (req, res) => {
    return req.user ? (req.user._id || req.user.id).toString() : ipKeyGenerator(req, res);
  },
  skip: (req) => req.body.type !== "location",
  handler: (req, res) => {
    res.status(429).json({
      code: "RATE_LIMIT_LOCATION",
      message: "Bạn gửi định vị quá nhanh. Vui lòng đợi 30 giây để gửi tiếp!",
    });
  },
});

// Rate limit cho tin nhắn loại "gif"
export const gifRateLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 giây
  max: 3, // Tối đa 3 lần / windowMs
  keyGenerator: (req, res) => {
    return req.user ? (req.user._id || req.user.id).toString() : ipKeyGenerator(req, res);
  },
  skip: (req) => req.body.type !== "gif",
  handler: (req, res) => {
    res.status(429).json({
      code: "RATE_LIMIT_GIF",
      message: "Bạn đang gửi GIF quá nhanh. Vui lòng chậm lại!",
    });
  },
});
