import { Router } from "express";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/utils/jwt";
import { hashPassword, comparePassword } from "@/utils/password";
import { success, fail } from "@/utils/response";
import { authMiddleware } from "@/middlewares/auth";

const router = Router();

const registerSchema = z.object({
  username: z.string().min(2).max(20),
  email: z.string().email(),
  password: z.string().min(6).max(32),
});

// 注册
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return fail(res, parsed.error.errors[0].message);
  }
  const { username, email, password } = parsed.data;

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (exists) {
    return fail(res, "用户名或邮箱已存在");
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return success(res, {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance },
  }, "注册成功");
});

// 登录
router.post("/login", async (req, res) => {
  const { account, password } = req.body as { account: string; password: string };
  if (!account || !password) {
    return fail(res, "请输入账号和密码");
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: account }, { email: account }] },
  });
  if (!user) {
    return fail(res, "账号不存在");
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return fail(res, "密码错误");
  }

  const token = signToken({ userId: user.id, role: user.role });
  return success(res, {
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, balance: user.balance, avatar: user.avatar },
  }, "登录成功");
});

// 获取当前用户信息
router.get("/profile", authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, username: true, email: true, role: true, balance: true, avatar: true, createdAt: true },
  });
  if (!user) {
    return fail(res, "用户不存在", 404, 404);
  }
  return success(res, user);
});

export default router;
