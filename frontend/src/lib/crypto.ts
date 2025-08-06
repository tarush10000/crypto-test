// Enhanced cryptographic utilities
export class CryptoUtils {
  // Generate a random prime (simplified for demo)
  static generatePrime(bits: number): number {
    const min = Math.pow(2, bits - 1);
    const max = Math.pow(2, bits) - 1;
    let candidate = Math.floor(Math.random() * (max - min) + min);
    
    // Make it odd
    if (candidate % 2 === 0) candidate++;
    
    // Simple primality check
    while (!this.isPrime(candidate)) {
      candidate += 2;
    }
    return candidate;
  }

  static isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    
    for (let i = 3; i * i <= n; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  static modPow(base: number, exp: number, mod: number): number {
    let result = 1;
    base = base % mod;
    
    while (exp > 0) {
      if (exp % 2 === 1) {
        result = (result * base) % mod;
      }
      exp = Math.floor(exp / 2);
      base = (base * base) % mod;
    }
    return result;
  }

  static modInverse(a: number, m: number): number {
    const extgcd = (a: number, b: number): [number, number, number] => {
      if (a === 0) return [b, 0, 1];
      const [gcd, x1, y1] = extgcd(b % a, a);
      const x = y1 - Math.floor(b / a) * x1;
      const y = x1;
      return [gcd, x, y];
    };
    
    const [gcd, x] = extgcd(a % m, m);
    if (gcd !== 1) throw new Error('Modular inverse does not exist');
    return ((x % m) + m) % m;
  }

  static hash(message: string): number {
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}