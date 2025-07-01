/**
 * 格式化數字，加上千分位並控制小數點
 * @param num 要格式化的數字或字串
 * @param options Intl.NumberFormat 的選項
 * @returns 格式化後的字串，若輸入無效則回傳 "-"
 */
export const formatNumber = (
  num: number | string | undefined,
  options?: Intl.NumberFormatOptions
): string => {
  if (num === undefined || num === null) return "-";
  const number = typeof num === "string" ? parseFloat(num) : num;
  if (isNaN(number)) return "-";
  return number.toLocaleString("en-US", options);
};
