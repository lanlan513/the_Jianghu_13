import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const VIEW_FILE = path.join(DATA_DIR, 'views.json');

type ViewMap = Record<string, number>;

const readViews = async (): Promise<ViewMap> => {
  try {
    const raw = await fs.readFile(VIEW_FILE, 'utf-8');
    return JSON.parse(raw) as ViewMap;
  } catch (error) {
    // 仅「文件还不存在」视为无数据；其它错误（如文件损坏）继续抛出，
    // 避免把已有计数静默当成 0 再覆盖写回
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
};

const writeViews = async (views: ViewMap): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  // 先写临时文件再原子重命名，读者永远拿到完整文件，不会读到写了一半的内容
  const tmpFile = `${VIEW_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(views, null, 2), 'utf-8');
  await fs.rename(tmpFile, VIEW_FILE);
};

// 单进程内串行化「读-改-写」：所有写操作排队执行，
// 避免并发请求读到同一份旧数据后互相覆盖（丢失计数）
let writeQueue: Promise<unknown> = Promise.resolve();

const withWriteLock = <T>(task: () => Promise<T>): Promise<T> => {
  const result = writeQueue.then(task);
  // 队列本身不因某次失败而中断，失败仍通过 result 抛给调用方
  writeQueue = result.catch(() => {});
  return result;
};

export const getViews = async (id: string): Promise<number> => {
  const views = await readViews();
  return views[id] ?? 0;
};

export const addView = async (id: string): Promise<number> => {
  return withWriteLock(async () => {
    const views = await readViews();
    const next = (views[id] ?? 0) + 1;
    views[id] = next;
    await writeViews(views);
    return next;
  });
};
