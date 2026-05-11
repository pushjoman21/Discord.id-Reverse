const crypto = require('crypto');

/**
 * PoW (Proof of Work) Runner für Node.js & Browser
 * Kann direkt oder als Web Worker verwendet werden
 */

class PoWRunner {
  constructor() {
    this.currentWork = null;
    this.aborted = false;
  }

  /**
   * Konvertiere Buffer zu Hex-String
   */
  static byteArrayToHex(buffer) {
    return buffer.toString('hex');
  }

  /**
   * Berechne Hash mit Node.js crypto
   */
  async computeHash(challenge, salt, algorithm) {
    const combined = String(challenge) + String(salt);
    return crypto
      .createHash(algorithm.toLowerCase().replace('-', ''))
      .update(combined)
      .digest('hex');
  }

  /**
   * Starte PoW Berechnung
   * @param {Object} params - Parameter für PoW
   * @param {string} params.algorithm - Hashing-Algorithmus (SHA-256, SHA-384, SHA-512)
   * @param {string} params.challenge - Challenge/Hash zum matchen
   * @param {string} params.salt - Salt für die Berechnung
   * @param {number} params.maxNumber - Maximale Zahl zum testen
   * @param {number} params.start - Startzahl (optional, default: 0)
   * @param {Function} callback - Callback bei Erfolg
   * @param {Function} errorCallback - Callback bei Fehler
   */
  async start(params, callback, errorCallback) {
    if (this.currentWork) {
      const error = new Error('PoW ist bereits aktiv. Bitte warten oder abbrechen.');
      if (errorCallback) errorCallback(error);
      return;
    }

    this.currentWork = true;
    this.aborted = false;

    const {
      algorithm = 'SHA-256',
      challenge,
      salt,
      maxNumber = 1000000,
      start = 0
    } = params;

    try {
      const startTime = Date.now();
      let found = false;
      let resultNumber = null;

      for (let number = start; number <= maxNumber; number += 1) {
        if (this.aborted) {
          console.log('⏹ PoW abgebrochen');
          this.currentWork = null;
          return;
        }

        const hash = await this.computeHash(salt, number, algorithm);

        if (hash === challenge) {
          const elapsed = Date.now() - startTime;
          found = true;
          resultNumber = number;

          const result = {
            number,
            took: elapsed,
            found: true,
            hash
          };

          console.log("[Solved] result : ", result);
          console.log(`[Time]: ${elapsed}ms`);

          this.currentWork = null;
          if (callback) callback(result);
          return result;
        }
      }

      if (!found) {
        const elapsed = Date.now() - startTime;
        const result = {
          found: false,
          took: elapsed,
          testedNumbers: maxNumber - start + 1
        };

        console.log('No results found within the given range.');
        console.log(`  Checked: ${result.testedNumbers}`);
        console.log(`  Time: ${elapsed}ms`);

        this.currentWork = null;
        if (callback) callback(result);
        return result;
      }
    } catch (error) {
      console.error('Error:', error.message);
      this.currentWork = null;
      if (errorCallback) errorCallback(error);
      throw error;
    }
  }

  /**
   * Abbruch der aktiven PoW Berechnung
   */
  abort() {
    this.aborted = true;
    console.log('⏹ Abbruch angefordert...');
  }
}

// ============================================
// Node.js CLI Ausführung
// ============================================

if (require.main === module) {
  // Beispiel Parameter
  const powParams = {
    algorithm: 'SHA-256',
    challenge: '10e32519bbf692ed71c8e7ad5b58631e457209cf338246adb6534dfc5f08d98d',
    maxNumber: 200000,
    salt: 'b3a0a5370586a847a9794d52?expires=1778520205',
    start: 0
  };

  async function main() {
    const runner = new PoWRunner();

    try {
      const result = await runner.start(powParams);
    } catch (error) {
      console.error('Fehler:', error.message);
      process.exit(1);
    }
  }

  main();
}

// Export für Browser & Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PoWRunner;
}

if (typeof window !== 'undefined') {
  window.PoWRunner = PoWRunner;
}
