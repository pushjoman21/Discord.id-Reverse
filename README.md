<div align="center">

# discord.id Proof-of-Work Analysis

Reverse engineering study of the JavaScript proof-of-work challenge used by discord.id, with a reference reimplementation in Python.

![Status](https://img.shields.io/badge/status-archived-lightgrey?style=flat-square)
![Purpose](https://img.shields.io/badge/purpose-educational-blue?style=flat-square)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)

</div>

> [!IMPORTANT]
> **Archived research · Educational use only**
> This repository documents past research and is no longer maintained. The analyzed system has changed since publication, so the findings are **outdated** and may not reflect current versions.
> The material is provided solely for educational and defensive security purposes. It must not be used to circumvent protections, automate access without authorization, or violate any platform's terms of service.

---

## Overview

At the time of analysis, discord.id had replaced its previous WebAssembly-based challenge with a pure JavaScript proof-of-work executed inside a Blob worker. This project extracts that logic, runs it in an isolated sandbox, and reimplements the algorithm in Python to document how it works.

## Repository Structure

| File | Description |
|------|-------------|
| `extracted_pow.js` | Proof-of-work logic extracted from the Blob worker |
| `pow_sandbox.js` | Minimal sandbox environment for executing the extracted code |
| `run_pow.js` | Runs the extracted JavaScript inside the sandbox |
| `solver.py` | Python reimplementation of the proof-of-work algorithm |
| `test.py` | Verifies the Python implementation against the reference output |

## Usage

```bash
# Python reference implementation
python test.py

# Original JavaScript inside the sandbox
node run_pow.js
```

---

## Legal Notice

Discord and discord.id are trademarks of their respective owners. This project is independent and is not affiliated with, sponsored or endorsed by them.

The software is provided "as is", without warranty of any kind. The author accepts no liability for any misuse.

## Contact & Takedown Requests

Vendors with concerns about this repository can reach out at **jomandiscord@gmail.com**. Content will be reviewed and adjusted or removed promptly where appropriate.
