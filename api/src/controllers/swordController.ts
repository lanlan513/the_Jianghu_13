import type { Request, Response, NextFunction, RequestHandler } from 'express';
import * as swordService from '../services/swordService.js';
import * as viewService from '../services/viewService.js';
import type { SwordFilterParams, ApiResponse } from '../../../shared/types.js';

// Express 4 不会自动捕获 async handler 的 rejection，
// 包一层把异常交给全局错误中间件，避免请求悬挂
const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const getSwords = (req: Request, res: Response) => {
  const params: SwordFilterParams = {
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    dynasty: req.query.dynasty as string | undefined,
    sect: req.query.sect as string | undefined,
    keyword: req.query.keyword as string | undefined,
    sortBy: req.query.sortBy as SwordFilterParams['sortBy'],
    sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
  };
  
  const result = swordService.getSwords(params);
  
  const response: ApiResponse<typeof result> = {
    code: 200,
    message: 'success',
    data: result,
  };
  
  res.json(response);
};

export const getPopularSwords = (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
  const swords = swordService.getPopularSwords(limit);
  
  const response: ApiResponse<typeof swords> = {
    code: 200,
    message: 'success',
    data: swords,
  };
  
  res.json(response);
};

export const getSwordById = (req: Request, res: Response) => {
  const { id } = req.params;
  const sword = swordService.getSwordById(id);
  
  if (!sword) {
    const response: ApiResponse<null> = {
      code: 404,
      message: '名剑未找到',
      data: null,
    };
    return res.status(404).json(response);
  }
  
  const response: ApiResponse<typeof sword> = {
    code: 200,
    message: 'success',
    data: sword,
  };
  
  res.json(response);
};

export const getSwordViews = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const count = await viewService.getViews(id);

  const response: ApiResponse<{ count: number }> = {
    code: 200,
    message: 'success',
    data: { count },
  };

  res.json(response);
});

export const addSwordView = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const count = await viewService.addView(id);

  const response: ApiResponse<{ count: number }> = {
    code: 200,
    message: 'success',
    data: { count },
  };

  res.json(response);
});
