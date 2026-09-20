import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const VIEW_FILE = path.join(DATA_DIR, 'views.json');
const TEMP_FILE = `${VIEW_FILE}.tmp`;

type ViewMap = Record<string, number>;

// 进程内缓存:首次访问时从磁盘加载,之后读写都基于这同一份数据,
// 并发请求看到的视图一致,也避免每次请求重复读盘。
let cache: ViewMap | null = null;

// 串行队列:所有"读-改-写"操作排队执行。
// 并发请求不再交错读写文件,从根上消除丢计数和撕裂写。
let queue: Promise<unknown> = Promise.resolve();

const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
  // 上一个任务无论成败,都接着执行当前任务
  const run = queue.then(task, task);
  // 队列本身不因某个任务失败而中断,失败仍通过 run 抛回给调用方
  queue = run.catch(() => {});
  return run;
};

const loadViews = async (): Promise<ViewMap> => {
  if (cache) {
    return cache;
  }
  try {
    const raw = await fs.readFile(VIEW_FILE, 'utf-8');
    cache = JSON.parse(raw) as ViewMap;
  } catch {
    cache = {};
  }
  return cache;
};

const persistViews = async (views: ViewMap): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // 先写临时文件再 rename:rename 是原子操作,
  // 即使中途进程崩溃,views.json 只会是完整旧版或完整新版,不会出现半截文件。
  await fs.writeFile(TEMP_FILE, JSON.stringify(views, null, 2), 'utf-8');
  await fs.rename(TEMP_FILE, VIEW_FILE);
};

export const getViews = async (id: string): Promise<number> => {
  const views = await enqueue(loadViews);
  return views[id] ?? 0;
};

export const addView = async (id: string): Promise<number> => {
  return enqueue(async () => {
    const views = await loadViews();
    const next = (views[id] ?? 0) + 1;
    views[id] = next;
    await persistViews(views);
    return next;
  });
};
