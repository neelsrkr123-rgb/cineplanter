// src/lib/utils.ts বা যেখানে আছে
export const getFallbackAvatar = (name: string = 'User'): string => {
  const initial = name.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=8b5cf6&color=fff&size=128&bold=true&length=1`;
};