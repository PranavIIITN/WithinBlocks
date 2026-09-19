// Converts a rupee amount into words using the Indian numbering system
// (crore / lakh / thousand / hundred), e.g. 2480 -> "Two Thousand Four
// Hundred Eighty Rupees only". Used for the "Invoice Total In Words" line
// on the PDF export. Mirrors Frontend/src/utils/numberToWords.js exactly —
// keep both in sync if this logic ever changes.

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
}

function threeDigitsToWords(n) {
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  let str = "";
  if (hundred) str += ONES[hundred] + " Hundred";
  if (rest) str += (str ? " " : "") + twoDigitsToWords(rest);
  return str;
}

function integerToWords(num) {
  if (num === 0) return "Zero";
  let crore = Math.floor(num / 10000000); num %= 10000000;
  let lakh = Math.floor(num / 100000); num %= 100000;
  let thousand = Math.floor(num / 1000); num %= 1000;
  let hundred = num;

  const parts = [];
  if (crore) parts.push(threeDigitsToWords(crore) + " Crore");
  if (lakh) parts.push(threeDigitsToWords(lakh) + " Lakh");
  if (thousand) parts.push(threeDigitsToWords(thousand) + " Thousand");
  if (hundred) parts.push(threeDigitsToWords(hundred));
  return parts.join(" ");
}

const amountToWords = (amount) => {
  const rupees = Math.floor(Number(amount) || 0);
  const paise = Math.round(((Number(amount) || 0) - rupees) * 100);
  const rupeesWords = integerToWords(rupees);
  if (paise > 0) {
    return `${rupeesWords} Rupees and ${integerToWords(paise)} Paise only`;
  }
  return `${rupeesWords} Rupees only`;
};

export { amountToWords };