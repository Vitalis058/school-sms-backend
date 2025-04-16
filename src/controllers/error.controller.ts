import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

//unique constraint
function uniqueConstraint(error: any) {
  const constraint = error.meta.target[0];
  return new AppError(`unique constraint ${constraint}`, 409);
}

export const errorController = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || "internal server error";

  console.log(error);

  if (error.code === "P2002") {
    const newError = uniqueConstraint(error);
    statusCode = newError.statusCode;
    message = `${error.meta.target[0]} is already taken`;
  }

  res.status(statusCode).json({
    message: message,
    success: false,
  });
};
