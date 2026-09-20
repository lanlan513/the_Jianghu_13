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
  } catch {
    return {};
  }
};

const writeViews = async (views: ViewMap): Promise<void> => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(VIEW_FILE, JSON.stringify(views, null, 2), 'utf-8');
};

export const getViews = async (id: string): Promise<number> => {
  const views = await readViews();
  return views[id] ?? 0;
};

export const addView = async (id: string): Promise<number> => {
  const views = await readViews();
  const next = (views[id] ?? 0) + 1;
  views[id] = next;
  await writeViews(views);
  return next;
};
