# Review your first AI-generated program

An AI assistant can suggest code and explain it. You still need to check that the program does what you asked. This lesson uses a tiny function so you can inspect the whole result.

## Ask for a small change

Use an AI chat you already have access to, or your editor's assistant. You do not need an API key.

Try this prompt:

> Write a Python function called larger that accepts two numbers and returns the larger one. Keep it readable for a beginner. Explain what happens when the numbers are equal. Do not install any packages.

Copy or save the proposed function in `larger.py`. Read it before running it. A possible implementation is:

```python
def larger(a, b):
    if a >= b:
        return a
    return b
```

The condition compares the inputs. Each `return` ends the function and gives its caller a value. Equal inputs have the same value, so either is a valid result.

## Test an answer you already know

Add these tests to the file:

```python
assert larger(2, 7) == 7
assert larger(-2, -7) == -2
assert larger(4, 4) == 4
print("Three tests passed")
```

Run the file with the Python command you verified during setup. An `assert` raises an error if its condition is false. All three tests passing is useful evidence for these cases, not proof that every possible input works.

## Ask a question, then change the code

Ask the assistant:

> What happens if one input is text? Explain before changing anything.

Then try `larger("two", 7)`. Python cannot order those values, so the function raises a type error. Decide whether that error is acceptable for your use case or whether the caller needs a clearer message.

If you change the function, rerun all three original tests and your new case. Ask the assistant to explain any line you cannot explain yourself.

## Keep the evidence

Save the prompt, the function and the test results in your practice folder. Write two sentences: what the assistant got right, and what you checked yourself.

For larger tasks, keep the same habit: narrow request, readable changes, explicit tests. Avoid accepting a long sequence of file edits or terminal commands just because the assistant says they are necessary.
