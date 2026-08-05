/**
 * i18n entry point — sau này sẽ thay thế bằng next-intl hoặc đa ngôn ngữ khác.
 * Hiện tại chỉ export tiếng Việt, các component đang dùng text cứng trong JSX.
 *
 * Khi migrate:
 *  1. Thay `import { vi } from "@/lib/i18n"` bằng `useTranslations()` từ next-intl
 *  2. Refactor component dùng hook thay vì string literal
 *  3. Cấu hình next-intl middleware + locale routing
 */
export { vi, t, type ViDictionary, type ViKey } from "./vi";
