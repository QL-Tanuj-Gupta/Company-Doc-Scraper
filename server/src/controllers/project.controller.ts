import { Request, Response } from "express";

export const createProject = (req: Request, res: Response) => {
  console.log("Create project request:", req.body);

  res.status(201).json({
    status: true,
    message: "Project received successfully",
    data: req.body,
  });
};
