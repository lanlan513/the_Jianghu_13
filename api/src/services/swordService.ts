import { swords } from '../data/swords.js';
import type { Sword, SwordFilterParams, SwordListResponse } from '../../../shared/types.js';

export const getSwords = (params: SwordFilterParams): SwordListResponse => {
  const { page = 1, limit = 10, dynasty, sect, keyword, sortBy = 'popularity', sortOrder = 'desc' } = params;
  
  let filteredSwords = [...swords];
  
  if (dynasty) {
    filteredSwords = filteredSwords.filter(s => s.dynasty === dynasty);
  }
  
  if (sect) {
    filteredSwords = filteredSwords.filter(s => s.sect === sect);
  }
  
  if (keyword) {
    // 关键词按字面量做不区分大小写的包含匹配；
    // 先转义正则元字符，避免用户输入 [ * \ 等字符时 RegExp 构造抛错
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    filteredSwords = filteredSwords.filter(s => 
      pattern.test(s.name) ||
      pattern.test(s.alias) ||
      pattern.test(s.owner) ||
      pattern.test(s.description)
    );
  }
  
  if (sortBy) {
    filteredSwords.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'popularity':
          comparison = a.popularity - b.popularity;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'dynasty':
          comparison = a.dynasty.localeCompare(b.dynasty, 'zh-CN');
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
  
  const total = filteredSwords.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  const list = filteredSwords.slice(start, end);
  
  return { list, total, page, limit };
};

export const getPopularSwords = (limit: number = 6): Sword[] => {
  return [...swords]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
};

export const getSwordById = (id: string): Sword | undefined => {
  return swords.find(s => s.id === id);
};
