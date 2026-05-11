# Discord.id POW Solver / Reverse

A small reverse-engineered POW solver for the latest version of **discord.id**.

They recently removed the WASM part, so this repository focuses on the reversed JavaScript POW logic.

If anyone has any complaints about this repository, feel free to contact me by email:

**jomandiscord@gmail.com**

---

## Files

### `run_pow.js`

A quick sandbox-based solver.

Originally made with Claude. Not Goot, but it works. (rlly shitty)

### `extracted_pow.js`

The extracted POW JavaScript part.

In the real site, this code is stored and executed through a Blob worker.

### `solver.py`

The Python POW solver.

Fully reversed and reimplemented in Python.

### `test.py`

Runs and verifies the solver output.

---

## Usage

Run the Python version:

```bash
python test.py
```

Run the JavaScript version:

```bash
node run_pow.js
```

---

## Notes

This project was made for fun and learning purposes.

Do not judge the code too hard — it was mostly built to understand how the POW flow works.

Enjoy.
