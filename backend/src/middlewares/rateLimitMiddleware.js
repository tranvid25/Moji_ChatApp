import { Redis } from "@upstash/redis";

// Khởi tạo Redis client từ biến env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Tự implement rate limit bằng INCR + EXPIRE (không dùng EVALSHA).
 * @param {string} key       - Redis key (vd: "rl:gif:userId")
 * @param {number} maxReqs   - Số request tối đa trong window
 * @param {number} windowSec - Kích thước window (giây)
 * @returns {{ success: boolean, remaining: number, ttl: number }}
 */
const checkRateLimit = async (key, maxReqs, windowSec) => {
  // INCR tăng counter, trả về giá trị mới
  const count = await redis.incr(key);

  if (count === 1) {
    // Lần đầu trong window → đặt TTL
    await redis.expire(key, windowSec);
  }

  const ttl = await redis.ttl(key);
  const remaining = Math.max(0, maxReqs - count);
  return { success: count <= maxReqs, remaining, ttl };
};

/**
 * Factory tạo Express middleware rate limit dùng Upstash Redis.
 * @param {string} type        - Loại tin nhắn cần giới hạn ("gif", "location", ...)
 * @param {number} maxReqs     - Số request tối đa
 * @param {number} windowSec   - Window tính bằng giây
 * @param {string} errorCode   - Mã lỗi trả về
 * @param {string} errorMessage - Thông báo lỗi cho user
 */
const createRateLimiter = (type, maxReqs, windowSec, errorCode, errorMessage) => {
  return async (req, res, next) => {
    // Bỏ qua nếu không phải loại tin nhắn cần giới hạn
    if (req.body.type !== type) return next();

    const userId = req.user
      ? (req.user._id || req.user.id).toString()
      : req.ip;

    const key = `rl:${type}:${userId}`;

    try {
      const { success, remaining, ttl } = await checkRateLimit(key, maxReqs, windowSec);

      if (!success) {
        res.setHeader("Retry-After", ttl > 0 ? ttl : windowSec);
        return res.status(429).json({
          code: errorCode,
          message: errorMessage,
          retryAfter: ttl > 0 ? ttl : windowSec,
        });
      }

      // Gắn remaining vào header để debug
      res.setHeader("X-RateLimit-Remaining", remaining);
      return next();
    } catch (err) {
      // Nếu Redis lỗi → failopen (không chặn user)
      console.error(`[RateLimit:${type}] Redis error:`, err.message);
      return next();
    }
  };
};

// Rate limit cho tin nhắn loại "location": tối đa 1 lần / 30 giây / user
export const locationRateLimiter = createRateLimiter(
  "location",
  1,
  30,
  "RATE_LIMIT_LOCATION",
  "Bạn gửi định vị quá nhanh. Vui lòng đợi 30 giây để gửi tiếp!"
);

// Rate limit cho tin nhắn loại "gif": tối đa 3 lần / 10 giây / user
export const gifRateLimiter = createRateLimiter(
  "gif",
  3,
  10,
  "RATE_LIMIT_GIF",
  "Bạn đang gửi GIF quá nhanh. Vui lòng chậm lại!"
);
