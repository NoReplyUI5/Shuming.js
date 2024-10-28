import { Buffer } from 'buffer';

/**
 * Generates a base64-encoded binary string from a given text password.
 * @param {string} text - The plain text password to encode.
 * @returns {string} - The base64-encoded binary string.
 */
export function generateBinaryCode(text) {
  const binaryBuffer = Buffer.from(text, 'utf-8'); // Convert text to binary buffer
  return binaryBuffer.toString('base64'); // Encode buffer as base64
}

// Example usage: run this script with the password you want to encode
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, inputText] = process.argv; // Take the text from command line arguments
  if (!inputText) {
    console.error("Please provide a password to encode.");
    process.exit(1);
  }
  
  const binaryCode = generateBinaryCode(inputText);
  console.log(`Base64-encoded binary code: ${binaryCode}`);
}
