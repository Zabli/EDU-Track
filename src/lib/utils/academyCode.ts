/**
 * Human-readable, flexible academy code generator and validator.
 * Supports:
 * 1. Simple short codes (e.g. 'BA', 'BS', 'BR', 'EDU')
 * 2. Short alphanumeric codes (e.g. 'BA-101', 'BR-1')
 * 3. Standard system generated format (e.g. 'BTA-7K4M9Q')
 */
export const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateAcademyCode(prefix = 'BTA', length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_ALPHABET.length);
    result += CODE_ALPHABET.charAt(randomIndex);
  }
  return `${prefix}-${result}`;
}

/**
 * Generates a simple, intuitive 2-4 letter code based on academy name.
 * e.g. "First Academy" -> "FA", "Alpha Center" -> "AC"
 */
export function generateSimpleAcademyCode(academyName: string): string {
  if (!academyName || typeof academyName !== 'string') return 'EDU';
  const clean = academyName.trim().replace(/[^a-zA-Z\s]/g, '');
  const words = clean.split(/\s+/).filter(Boolean);
  
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  if (words.length === 1 && words[0].length >= 2) {
    return words[0].slice(0, 3).toUpperCase();
  }
  return 'EDU';
}

export function isValidAcademyCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const upper = code.trim().toUpperCase();

  // 1. Simple short acronyms (2-4 uppercase letters, e.g. BA, BS, BR, BTA, EDU)
  if (/^[A-Z]{2,4}$/.test(upper)) return true;

  // 2. Simple hyphenated codes (e.g. BA-101, BS-1, BR-2)
  if (/^[A-Z]{2,4}-[0-9]{1,4}$/.test(upper)) return true;

  // 3. Standard system format (e.g. BTA-7K4M9Q) excluding ambiguous 0, 1, O, I
  const standardRegex = /^[A-Z]{2,4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/;
  return standardRegex.test(upper);
}
