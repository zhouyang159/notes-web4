import CryptoJS from 'crypto-js';

// 固定密钥
const SECRET_KEY = 'DK12345678912345';

// 加密函数
export const encryptText = (text) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY); // AES 密钥长度需要 16 字节
  const encrypted = CryptoJS.AES.encrypt(text, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
};

// 解密函数
export const decryptText = (encryptedText) => {
  const key = CryptoJS.enc.Utf8.parse(SECRET_KEY); // AES 密钥长度需要 16 字节
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
};
