export const truncateDocumentName = (
  name: string,
  maxLength: number = 35,
): string => {
  if (name.length <= maxLength) {
    return name;
  }
  return name.substring(0, maxLength) + '..';
};
