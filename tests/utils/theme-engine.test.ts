import { describe, it, expect } from 'vitest';
import { getThemeById, normalizeTheme, exportThemeToJson, importThemeFromJson } from '@/utils/theme-engine';
import { BUILTIN_THEMES } from '@/types/theme';

describe('Theme Engine 主题解析与导入导出测试', () => {
  describe('getThemeById', () => {
    it('正确返回已内置的主题对象', () => {
      const theme = getThemeById('raycast-dark');
      expect(theme).toBeDefined();
      expect(theme.id).toBe('raycast-dark');
      expect(theme.ambient.isDark).toBe(true);
    });

    it('对旧版已下线主题执行平滑降级映射', () => {
      const theme = getThemeById('modern-dark');
      expect(theme.id).toBe('raycast-dark');
    });

    it('对不存在的非法主题 ID 回退到默认内置主题', () => {
      const fallbackTheme = getThemeById('non-existent-theme-xyz');
      expect(fallbackTheme.id).toBe('raycast-dark');
    });
  });

  describe('normalizeTheme', () => {
    it('对缺失字段的第三方主题 JSON 执行深度补全，确保安全渲染', () => {
      const incomplete = {
        id: 'my-custom-theme',
        name: 'My Custom Theme',
        card: {
          background: '#000000',
        },
      };

      const normalized = normalizeTheme(incomplete);
      expect(normalized.id).toBe('my-custom-theme');
      expect(normalized.card.background).toBe('#000000');
      // 缺省的 typography / ambient 自动从 baseline 补全
      expect(normalized.typography.textPrimary).toBeDefined();
      expect(normalized.ambient.outerBackground).toBeDefined();
    });
  });

  describe('exportThemeToJson & importThemeFromJson', () => {
    it('能够成功序列化并在反序列化时完整校验还原', () => {
      const original = BUILTIN_THEMES['raycast-dark'];
      const exportedJson = exportThemeToJson(original);
      
      expect(typeof exportedJson).toBe('string');
      expect(exportedJson).toContain('"raycast-dark"');

      const result = importThemeFromJson(exportedJson);
      expect(result.success).toBe(true);
      expect(result.theme).toBeDefined();
      expect(result.theme?.name).toContain(original.name);
    });

    it('传入非法 JSON 文本时优雅返回失败结果与错误信息', () => {
      const result = importThemeFromJson('{ invalid json');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
