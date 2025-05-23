import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";

export const protectedRoute = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      message: "Hello",
    });
  }
);
