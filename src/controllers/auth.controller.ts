import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { SigninSchema, SignupSchema } from "../utils/validation";
import { AppError } from "../utils/AppError";
import bcrypt from "bcrypt";
import { prisma } from "../utils/Prisma";
import jwt, { Secret, SignOptions } from "jsonwebtoken";

const signJwt = (id: number) => {
  return jwt.sign(
    { userId: id },
    process.env.JWT_SECRET as Secret,
    {
      expiresIn: process.env.JWT_EXPIRE,
    } as SignOptions
  );
};

export const signup = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = SignupSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 404));
    }

    const { email, password, username } = validatedData.data;
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        password: passwordHash,
        username,
        email,
      },
    });

    const token = signJwt(newUser.id);

    res.cookie("jwtToken", token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      //TODO cookie secure option
    });

    res.status(200).json({
      data: newUser,
      success: true,
      token: token,
    });
  }
);

export const signin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = SigninSchema.safeParse(req.body);

    if (!validatedData.success) {
      return next(new AppError(validatedData.error.errors[0].message, 401));
    }
    const { password, username } = validatedData.data;

    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) {
      return next(new AppError("Invalid credentials", 401));
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return next(new AppError("Invalid credentials", 401));
    }

    const token = signJwt(user.id);

    res.cookie("jwtToken", token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      //TODO cookie secure option
    });

    res.status(200).json({
      data: user,
      success: true,
      token: token,
    });
  }
);
