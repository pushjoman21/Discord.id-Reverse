/**
 * PoW (Proof of Work) Web Worker für Browser
 * Führt CPU-intensive PoW-Berechnungen in eigenem Thread aus
 * 
 * Unterstützt zwei Modi:
 * 1. Challenge-basiert (SHA-256 Hashing)
 * 2. Obfuscated Data (AES-GCM Decryption)
 */

(function() {
  'use strict';

  // ========== Utilities ==========
  
  const textEncoder = new TextEncoder();

  /**
   * Konvertiere Uint8Array zu Hex-String
   */
  function byteArrayToHex(buffer) {
    return [...new Uint8Array(buffer)]
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generiere Hash mit Web Crypto API
   * @param {string} challenge - Challenge/Daten zum hashen
   * @param {string|number} salt - Salt/Nonce
   * @param {string} algorithm - Hash-Algorithmus (SHA-256, SHA-384, SHA-512)
   */
  async function computeHash(challenge, salt, algorithm) {
    if (typeof crypto === 'undefined' || !crypto.subtle || !crypto.subtle.digest) {
      throw new Error(
        'Web Crypto API nicht verfügbar. Secure Context erforderlich (HTTPS oder localhost).\n' +
        'Siehe: https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts'
      );
    }
    
    const combined = challenge + salt;
    const digest = await crypto.subtle.digest(
      algorithm.toUpperCase(),
      textEncoder.encode(combined)
    );
    
    return byteArrayToHex(digest);
  }

  /**
   * PoW-Modus 1: Challenge-basiert
   * Finde eine Zahl, bei der hash(challenge + salt + number) == challenge
   */
  function createSHA256Worker(targetHash, salt, algorithm = 'SHA-256', maxNumber = 1e6, startNumber = 0) {
    const abortController = new AbortController();
    const startTime = Date.now();

    return {
      promise: (async () => {
        for (let number = startNumber; number <= maxNumber; number += 1) {
          if (abortController.signal.aborted) {
            return null;
          }

          const hash = await computeHash(salt, number, algorithm);
          if (hash === targetHash) {
            return {
              number: number,
              took: Date.now() - startTime,
              found: true
            };
          }

          // Performance: Gib gelegentlich Kontrolle zurück
          if (number % 10000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        return {
          found: false,
          took: Date.now() - startTime
        };
      })(),
      controller: abortController
    };
  }

  /**
   * Base64 zu Uint8Array
   */
  function base64ToByteArray(base64String) {
    const binary = atob(base64String);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Generiere IV (Initialization Vector) für AES-GCM
   */
  function generateIV(number, length = 12) {
    const iv = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      iv[i] = number % 256;
      number = Math.floor(number / 256);
    }
    return iv;
  }

  /**
   * PoW-Modus 2: Obfuscated (AES-GCM Decryption)
   * Finde eine Zahl, mit der verschlüsselte Daten dekryptiert werden können
   */
  async function createObfuscatedWorker(obfuscatedBase64, key, maxNumber = 1e6, startNumber = 0) {
    const algorithmName = 'AES-GCM';
    const abortController = new AbortController();
    const startTime = Date.now();

    // Vorbereitung
    let cryptoKey = null;
    let obfuscatedBytes = null;

    try {
      obfuscatedBytes = base64ToByteArray(obfuscatedBase64);
      const keyDigest = await crypto.subtle.digest('SHA-256', textEncoder.encode(key));
      cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyDigest,
        algorithmName,
        false,
        ['decrypt']
      );
    } catch (error) {
      console.error('Obfuscated Worker Setup Error:', error);
      return {
        promise: Promise.reject(error),
        controller: abortController
      };
    }

    const workerPromise = (async () => {
      for (let number = startNumber; number <= maxNumber; number += 1) {
        if (abortController.signal.aborted || !cryptoKey || !obfuscatedBytes) {
          return null;
        }

        try {
          const clearText = await crypto.subtle.decrypt(
            {
              name: algorithmName,
              iv: generateIV(number)
            },
            cryptoKey,
            obfuscatedBytes
          );

          if (clearText) {
            return {
              clearText: new TextDecoder().decode(clearText),
              number: number,
              took: Date.now() - startTime,
              found: true
            };
          }
        } catch (error) {
          // Erwartet - meisten Nummern führen zu Decryption-Fehlern
        }

        if (number % 10000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      return {
        found: false,
        took: Date.now() - startTime
      };
    })();

    return {
      promise: workerPromise,
      controller: abortController
    };
  }

  // ========== Worker Message Handler ==========

  let currentWorker = null;

  self.onmessage = async (event) => {
    const { type, payload, start = 0, max = 1000000 } = event.data;

    if (type === 'abort') {
      if (currentWorker && currentWorker.controller) {
        currentWorker.controller.abort();
        console.log('[Worker] PoW abgebrochen');
      }
      currentWorker = null;

    } else if (type === 'work') {
      let worker = null;

      if (payload.obfuscated) {
        // Modus 2: Obfuscated
        const { key, obfuscated } = payload;
        worker = await createObfuscatedWorker(obfuscated, key, max, start);
      } else {
        // Modus 1: Challenge-basiert (Standard)
        const { algorithm, challenge, salt } = payload;
        worker = createSHA256Worker(challenge, salt, algorithm || 'SHA-256', max, start);
      }

      currentWorker = worker;

      // Warte auf Ergebnis und sende zurück
      try {
        const result = await worker.promise;
        if (result) {
          self.postMessage({
            ...result,
            worker: true
          });
        }
      } catch (error) {
        self.postMessage({
          error: error.message,
          worker: true
        });
      }
    }
  };

  console.log('[Worker] PoW Sandbox bereit');
})();
