/**
 * 轻量查询缓存：同一 key 的请求只打一次后端，进行中的请求直接复用，
 * 拿到结果后缓存起来，避免列表页和详情页频繁重复请求。
 */

type Fetcher<T> = () => Promise<T>;

const inflight = new Map<string, Promise<unknown>>();
const settled = new Map<string, unknown>();

export function cachedQuery<T>(key: string, fetcher: Fetcher<T>): Promise<T> {
  if (settled.has(key)) {
    return Promise.resolve(settled.get(key) as T);
  }

  const pending = inflight.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  const promise = fetcher().then((data) => {
    settled.set(key, data);
    inflight.delete(key);
    return data;
  });

  inflight.set(key, promise);
  return promise;
}
