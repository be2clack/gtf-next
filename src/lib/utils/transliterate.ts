/**
 * Transliterate Cyrillic to Latin characters
 * Based on the Laravel TransliterationService
 */

const cyrillicToLatinMap: Record<string, string> = {
  // Russian / Kyrgyz / Kazakh
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Kyrgyz specific
  'ң': 'n', 'ү': 'u', 'ө': 'o',
  // Kazakh specific
  'ә': 'a', 'ғ': 'g', 'қ': 'q', 'ұ': 'u', 'һ': 'h', 'і': 'i',
  // Capital letters
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
  'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
  'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
  'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
  'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
  'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
  'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
  'Ң': 'N', 'Ү': 'U', 'Ө': 'O',
  'Ә': 'A', 'Ғ': 'G', 'Қ': 'Q', 'Ұ': 'U', 'Һ': 'H', 'І': 'I',
}

export function transliterate(text: string): string {
  if (!text) return ''

  return text
    .split('')
    .map(char => cyrillicToLatinMap[char] ?? char)
    .join('')
}

export function transliterateName(
  firstName?: string | null,
  lastName?: string | null,
  middleName?: string | null
): { firstNameLatin: string; lastNameLatin: string; middleNameLatin: string } {
  return {
    firstNameLatin: transliterate(firstName ?? ''),
    lastNameLatin: transliterate(lastName ?? ''),
    middleNameLatin: transliterate(middleName ?? ''),
  }
}

/**
 * Generate public ID from name
 */
export function generatePublicId(lastName: string, firstName: string): string {
  const lastNameLatin = transliterate(lastName).toLowerCase().slice(0, 3)
  const firstNameLatin = transliterate(firstName).toLowerCase().slice(0, 2)
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${lastNameLatin}${firstNameLatin}-${randomPart}`.toUpperCase()
}
