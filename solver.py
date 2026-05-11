# creds : joman21 
import base64
import json 
import hashlib
import time 
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

class Utils:

    def __init__(self):
        pass

    def bytes_to_hex(self, data: bytes) -> str:
        return "".join(hex(byte)[2:].zfill(2) for byte in data)
    
    def calculate_digest_hex(self, salt, number, algorithm):
        python_algorithm = algorithm.upper().replace("-", "").lower()
        payload = (str(salt) + str(number)).encode("utf-8")
        digest = hashlib.new(python_algorithm, payload).digest()
        return self.bytes_to_hex(digest)
    
    def base64_to_bytes(self, data: str) -> bytes:
        return base64.b64decode(data)
    
    def number_to_12_byte_iv(self, number, iv_size=12):
        iv = bytearray(iv_size)

        for index in range(iv_size):
            iv[index] = number % 256
            number = number // 256

        return bytes(iv)
    
    def brute_force_aes_gcm(self, obfuscated, key="", max_number=1_000_000, start_number=0):
        started_at = int(time.time() * 1000)

        try:
            encrypted_data = self.base64_to_bytes(obfuscated)
            aes_key = hashlib.sha256(str(key).encode("utf-8")).digest()
            aes_gcm = AESGCM(aes_key)
        except Exception:
            return None

        for current_number in range(start_number, max_number + 1):
            try:
                iv = self.number_to_12_byte_iv(current_number)
                decrypted_data = aes_gcm.decrypt(iv, encrypted_data, None)

                if decrypted_data:
                    return {
                        "clearText": decrypted_data.decode("utf-8"),
                        "took": int(time.time() * 1000) - started_at
                    }

            except Exception:
                pass

        return None
    
utils = Utils()
    
def solve_pow(challenge, salt, algorithm="SHA-256", max_number=1000000, start_number=0):
    started_at = int(time.time() * 1000)

    for current_number in range(start_number, max_number + 1):
        current_digest = utils.calculate_digest_hex(
            salt,
            current_number,
            algorithm
        )

        if current_digest == challenge:
            return {
                "number": current_number,
                "took": int(time.time() * 1000) - started_at
            }

    return None

def nigga(payload, start_number, max_number):

    if "obfuscated" in payload:
        result = utils.brute_force_aes_gcm(
            obfuscated=payload["obfuscated"],
            key = payload["key"],
            max_number=max_number,
            start_number=start_number
        )
    else:
        # GO HERE SKIDS
        result = solve_pow(
            challenge=payload["challenge"],
            salt=payload["salt"],
            algorithm=payload["algorithm"],
            max_number=max_number,
            start_number=start_number
        )

    if result:
        number = result["number"]
        took = result["took"]
        result = {
            "algorithm": payload["algorithm"],
            "challenge": payload["challenge"],
            "number": number,
            "salt": payload["salt"],
            "signature": payload["signature"],
            "took": took
        }
        print(f"[POW] Solved [{number}] [{took} ms]")
        result = base64.b64encode(json.dumps(result).encode("utf-8")).decode("utf-8")

    return result

