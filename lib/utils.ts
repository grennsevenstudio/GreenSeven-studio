
/**
 * Formats a string into a CPF format (XXX.XXX.XXX-XX).
 * @param value The string to format.
 * @returns The formatted CPF string.
 */
export const formatCPF = (value: string): string => {
  if (!value) return value;
  
  // Remove all non-digit characters
  const cpf = value.replace(/\D/g, '');

  // Apply mask and limit to 11 digits
  return cpf
    .slice(0, 11) 
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

/**
 * Validates a Brazilian CPF number using the official algorithm.
 * @param value The CPF string to validate (can be formatted or not).
 * @returns True if the CPF is valid, false otherwise.
 */
export const validateCPF = (value: string): boolean => {
  if (typeof value !== 'string') return false;

  const cpf = value.replace(/[^\d]+/g, '');

  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) {
    return false;
  }

  const cpfArray = cpf.split('').map(el => +el);
  
  const rest = (count: number): number => {
    const sum = cpfArray
        .slice(0, count-12)
        .reduce((soma, el, index) => soma + el * (count - index), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return rest(10) === cpfArray[9] && rest(11) === cpfArray[10];
};
