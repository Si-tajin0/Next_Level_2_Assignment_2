import type { Request, Response } from "express";
import { authService } from "./auth.service";
import { sendResponse } from "../../utils/sendResponce";

//create a signup user
const signupUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // validation
    if (!name || !email || !password) {
      return sendResponse(
        res,
        {
          message: "Name, Email, and Password are required",
          error: true,
        },
        400,
      );
    }
    const result = await authService.signupUserIntoDB({
      name,
      email,
      password,
      role,
    });

    sendResponse(
      res,
      {
        message: "User Registerd Successfully",
        data: result,
      },
      201,
    );
  } catch (error: any) {
    sendResponse(
      res,
      { message: error.message || "Signup Failed", error: true },
      400,
    );
  }
};

// sign in login user
const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    //validation
    if (!email || !password) {
      return sendResponse(
        res,
        {
          message: "Email and Password are Required",
          error: true,
        },
        400,
      );
    }
    const result = await authService.loginUserIntoDB({ email, password });

    sendResponse(
      res,
      {
        message: "login Successful",
        data: result,
      },
      200,
    );
  } catch (error: any) {
    sendResponse(
      res,
      {
        message: error.message || "Login Faild",
        error: true,
      },
      401,
    );
  }
};

export const authController = {
  signupUser,
  loginUser,
};
