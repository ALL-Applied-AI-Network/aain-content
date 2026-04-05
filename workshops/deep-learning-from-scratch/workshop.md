# Deep Learning from Scratch

Build a neural network from scratch in Python. No PyTorch, no TensorFlow -- just NumPy, math, and a clear understanding of what happens inside a neural network.

## Workshop Overview

Frameworks like PyTorch hide the mechanics of deep learning behind convenient APIs. That is great for productivity, but it means most people train neural networks without understanding how they actually work. This workshop strips away the abstraction.

You will build a feedforward neural network from raw NumPy arrays. You will implement forward propagation, loss calculation, backpropagation, and gradient descent by hand. Then you will train your network to classify handwritten digits from the MNIST dataset and watch it learn in real time.

This is the hardest workshop in the toolkit. It requires mathematical thinking. But by the end, you will have genuine intuition for what deep learning frameworks are doing under the hood.

## Prerequisites

- Strong Python skills (classes, NumPy array operations)
- Basic linear algebra: matrix multiplication, transpose, dot product
- Calculus: understanding of derivatives and the chain rule (we will review these)
- Willingness to work through math alongside code

## Materials Needed

Install the following before the workshop:

- Python 3.10+
- A code editor (Cursor recommended)
- `pip install numpy matplotlib scikit-learn`
- No GPU needed -- we train on CPU

## Agenda

| Time | Section | Description |
|---|---|---|
| 0:00 - 0:15 | **The Big Picture** | What is a neural network, mathematically? |
| 0:15 - 0:40 | **Forward Propagation** | Build the forward pass: inputs to predictions. |
| 0:40 - 1:05 | **Loss and Backpropagation** | Implement the backward pass: computing gradients. |
| 1:05 - 1:15 | **Break** | |
| 1:15 - 1:40 | **Training Loop** | Gradient descent and batch training. |
| 1:40 - 2:10 | **MNIST Classification** | Train on real data and visualize results. |
| 2:10 - 2:40 | **Experiments and Extensions** | Tune hyperparameters and add features. |
| 2:40 - 3:00 | **Debrief** | Connect what you built to real frameworks. |

---

## Part 1: The Big Picture (15 min)

A neural network is a function that maps inputs to outputs through a series of **layers**. Each layer applies two operations:

1. **Linear transformation**: multiply inputs by weights, add a bias
2. **Activation function**: apply a nonlinear function to the result

Mathematically, a single layer does this:

```
output = activation(weights @ input + bias)
```

Where `@` is matrix multiplication.

Stack multiple layers and you get a network that can learn complex patterns:

```
Input -> Layer 1 -> Layer 2 -> ... -> Output
```

The entire learning process is:
1. **Forward pass** -- compute the output given an input
2. **Loss** -- measure how wrong the output is
3. **Backward pass** -- compute how to adjust each weight to reduce the loss
4. **Update** -- adjust the weights by a small amount in the right direction
5. **Repeat** thousands of times

Create your project:

```bash
mkdir dl-workshop && cd dl-workshop
python -m venv venv
source venv/bin/activate
pip install numpy matplotlib scikit-learn
```

Create `neural_net.py`:

```python
import numpy as np

np.random.seed(42)
```

---

## Part 2: Forward Propagation (25 min)

### Activation Functions

Activation functions introduce nonlinearity. Without them, stacking layers would be equivalent to a single linear transformation (no matter how many layers, the result is still linear).

```python
def relu(z):
    """ReLU activation: max(0, z)"""
    return np.maximum(0, z)

def relu_derivative(z):
    """Derivative of ReLU: 1 if z > 0, else 0"""
    return (z > 0).astype(float)

def softmax(z):
    """Softmax: convert raw scores to probabilities."""
    # Subtract max for numerical stability
    exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))
    return exp_z / np.sum(exp_z, axis=1, keepdims=True)
```

**ReLU** (Rectified Linear Unit) is the workhorse of modern deep learning. It is simple: if the input is positive, pass it through. If negative, output zero.

**Softmax** converts a vector of raw scores into probabilities that sum to 1. We use it in the output layer for classification.

### Building a Layer

A layer stores weights and biases and knows how to compute its output.

```python
class Layer:
    def __init__(self, input_size, output_size):
        """Initialize a fully connected layer."""
        # He initialization: scale weights by sqrt(2/input_size)
        # This prevents signals from shrinking or exploding as they pass through layers
        self.weights = np.random.randn(input_size, output_size) * np.sqrt(2.0 / input_size)
        self.biases = np.zeros((1, output_size))

        # These will store values needed for backpropagation
        self.input = None
        self.z = None  # Pre-activation output
```

### The Network

Stack layers into a network that performs the full forward pass:

```python
class NeuralNetwork:
    def __init__(self, layer_sizes):
        """
        Create a neural network.

        Args:
            layer_sizes: list of integers, e.g. [784, 128, 64, 10]
                         meaning: 784 inputs, two hidden layers (128 and 64 neurons),
                         10 outputs (one per digit class)
        """
        self.layers = []
        for i in range(len(layer_sizes) - 1):
            self.layers.append(Layer(layer_sizes[i], layer_sizes[i + 1]))

    def forward(self, X):
        """
        Forward pass: compute output from input.

        Args:
            X: input data, shape (batch_size, input_size)

        Returns:
            Predicted probabilities, shape (batch_size, num_classes)
        """
        current_input = X

        for i, layer in enumerate(self.layers):
            # Store input for backpropagation
            layer.input = current_input

            # Linear transformation: z = input @ weights + bias
            layer.z = current_input @ layer.weights + layer.biases

            # Apply activation
            if i < len(self.layers) - 1:
                # Hidden layers: ReLU
                current_input = relu(layer.z)
            else:
                # Output layer: Softmax
                current_input = softmax(layer.z)

        return current_input
```

### Test the Forward Pass

```python
# Create a small network: 4 inputs, 8 hidden neurons, 3 outputs
net = NeuralNetwork([4, 8, 3])

# Random input: batch of 2 samples, 4 features each
X = np.random.randn(2, 4)

# Forward pass
output = net.forward(X)
print(f"Output shape: {output.shape}")
print(f"Output:\n{output}")
print(f"Row sums (should be ~1.0): {output.sum(axis=1)}")
```

The output is a probability distribution over 3 classes. The network is untrained, so the probabilities are essentially random. Training will make them meaningful.

---

## Part 3: Loss and Backpropagation (25 min)

### Cross-Entropy Loss

For classification, we use cross-entropy loss. It measures how far the predicted probabilities are from the true labels.

```python
def cross_entropy_loss(predictions, targets):
    """
    Compute cross-entropy loss.

    Args:
        predictions: predicted probabilities, shape (batch_size, num_classes)
        targets: true labels as integers, shape (batch_size,)

    Returns:
        Scalar loss value
    """
    batch_size = predictions.shape[0]
    # Clip to avoid log(0)
    clipped = np.clip(predictions, 1e-12, 1.0 - 1e-12)
    # Select the predicted probability for the correct class
    correct_probs = clipped[np.arange(batch_size), targets]
    # Negative log probability
    loss = -np.mean(np.log(correct_probs))
    return loss
```

If the network assigns probability 0.9 to the correct class, the loss is low (-log(0.9) = 0.105). If it assigns 0.01, the loss is high (-log(0.01) = 4.6). The loss pushes the network to assign high probability to the correct class.

### Backpropagation

Backpropagation computes the gradient of the loss with respect to every weight in the network. This tells us which direction to adjust each weight to reduce the loss.

The math uses the chain rule from calculus. We work backward from the output layer:

```python
def backward(self, predictions, targets, learning_rate=0.01):
    """
    Backward pass: compute gradients and update weights.

    Args:
        predictions: output of forward pass, shape (batch_size, num_classes)
        targets: true labels as integers, shape (batch_size,)
        learning_rate: step size for weight updates
    """
    batch_size = predictions.shape[0]

    # --- Output layer gradient ---
    # For softmax + cross-entropy, the gradient simplifies to:
    # dL/dz = predictions - one_hot(targets)
    delta = predictions.copy()
    delta[np.arange(batch_size), targets] -= 1
    delta /= batch_size

    # --- Propagate gradients backward through layers ---
    for i in reversed(range(len(self.layers))):
        layer = self.layers[i]

        # Gradient of weights: input^T @ delta
        grad_weights = layer.input.T @ delta

        # Gradient of biases: sum of delta across the batch
        grad_biases = np.sum(delta, axis=0, keepdims=True)

        # Update weights and biases
        layer.weights -= learning_rate * grad_weights
        layer.biases -= learning_rate * grad_biases

        # Propagate delta to the previous layer (if not the first layer)
        if i > 0:
            delta = delta @ layer.weights.T
            # Apply derivative of ReLU
            delta *= relu_derivative(self.layers[i - 1].z)
```

Add this method to the `NeuralNetwork` class.

### Understanding the Math

The key insight of backpropagation is the **chain rule**. To find how a weight in layer 1 affects the final loss, you multiply the local gradients at each layer between that weight and the output.

For the output layer with softmax + cross-entropy, the gradient has a beautifully simple form: `predictions - one_hot_targets`. If the prediction for the correct class is 0.3, the gradient pushes it toward 1.0. If a wrong class has prediction 0.5, the gradient pushes it toward 0.0.

For hidden layers, the gradient flows backward through the weight matrices, with the ReLU derivative acting as a gate: neurons that were active (output > 0) pass the gradient through, and neurons that were inactive (output = 0) block it.

---

## Part 4: Training Loop (25 min)

Now put it all together: forward pass, loss, backward pass, repeat.

```python
def train(self, X, y, epochs=100, learning_rate=0.01, batch_size=32, verbose=True):
    """
    Train the network.

    Args:
        X: training data, shape (num_samples, input_size)
        y: training labels, shape (num_samples,)
        epochs: number of complete passes through the data
        learning_rate: step size for gradient descent
        batch_size: number of samples per gradient update
        verbose: print progress
    """
    history = {"loss": [], "accuracy": []}
    num_samples = X.shape[0]

    for epoch in range(epochs):
        # Shuffle data each epoch
        indices = np.random.permutation(num_samples)
        X_shuffled = X[indices]
        y_shuffled = y[indices]

        epoch_loss = 0
        num_batches = 0

        # Mini-batch training
        for start in range(0, num_samples, batch_size):
            end = start + batch_size
            X_batch = X_shuffled[start:end]
            y_batch = y_shuffled[start:end]

            # Forward pass
            predictions = self.forward(X_batch)

            # Compute loss
            loss = cross_entropy_loss(predictions, y_batch)
            epoch_loss += loss
            num_batches += 1

            # Backward pass (updates weights)
            self.backward(predictions, y_batch, learning_rate)

        # Track metrics
        avg_loss = epoch_loss / num_batches
        predictions_full = self.forward(X)
        accuracy = np.mean(np.argmax(predictions_full, axis=1) == y)

        history["loss"].append(avg_loss)
        history["accuracy"].append(accuracy)

        if verbose and (epoch + 1) % 10 == 0:
            print(f"Epoch {epoch + 1:4d}/{epochs} | Loss: {avg_loss:.4f} | Accuracy: {accuracy:.4f}")

    return history
```

Add this method to the `NeuralNetwork` class.

### Test on Synthetic Data

Before tackling MNIST, verify the network can learn a simple problem:

```python
# Generate a simple classification problem
from sklearn.datasets import make_moons

X_train, y_train = make_moons(n_samples=500, noise=0.2, random_state=42)

# Create network: 2 inputs, 16 hidden, 2 outputs
net = NeuralNetwork([2, 16, 2])

# Train
history = net.train(X_train, y_train, epochs=200, learning_rate=0.1, batch_size=32)

print(f"\nFinal accuracy: {history['accuracy'][-1]:.4f}")
```

You should see accuracy climbing toward 0.85+ on this toy dataset. If the loss is decreasing and accuracy is increasing, your implementation is working.

### Visualize Training Progress

```python
import matplotlib.pyplot as plt

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

ax1.plot(history["loss"])
ax1.set_title("Training Loss")
ax1.set_xlabel("Epoch")
ax1.set_ylabel("Loss")

ax2.plot(history["accuracy"])
ax2.set_title("Training Accuracy")
ax2.set_xlabel("Epoch")
ax2.set_ylabel("Accuracy")

plt.tight_layout()
plt.savefig("training_progress.png")
plt.show()
```

---

## Part 5: MNIST Classification (30 min)

MNIST is a dataset of 70,000 handwritten digits (0-9), each a 28x28 grayscale image. It is the classic "hello world" of deep learning.

### Load and Prepare the Data

```python
from sklearn.datasets import fetch_openml
from sklearn.model_selection import train_test_split

def load_mnist():
    """Load and preprocess the MNIST dataset."""
    print("Loading MNIST... (this may take a minute the first time)")
    mnist = fetch_openml("mnist_784", version=1, as_frame=False)
    X, y = mnist.data, mnist.target.astype(int)

    # Normalize pixel values to [0, 1]
    X = X / 255.0

    # Split into train and test
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print(f"Training set: {X_train.shape[0]} samples")
    print(f"Test set: {X_test.shape[0]} samples")
    print(f"Input shape: {X_train.shape[1]} features (28x28 pixels flattened)")
    print(f"Classes: {np.unique(y_train)}")

    return X_train, X_test, y_train, y_test
```

### Visualize Some Digits

```python
def show_samples(X, y, n=10):
    """Display sample digits."""
    fig, axes = plt.subplots(1, n, figsize=(n * 1.5, 1.5))
    indices = np.random.choice(len(X), n, replace=False)
    for ax, idx in zip(axes, indices):
        ax.imshow(X[idx].reshape(28, 28), cmap="gray")
        ax.set_title(str(y[idx]))
        ax.axis("off")
    plt.tight_layout()
    plt.savefig("sample_digits.png")
    plt.show()

X_train, X_test, y_train, y_test = load_mnist()
show_samples(X_train, y_train)
```

### Train on MNIST

```python
# Network architecture: 784 -> 128 -> 64 -> 10
# 784 = 28*28 input pixels
# 128 and 64 = hidden layer sizes (experiment with these)
# 10 = output classes (digits 0-9)

net = NeuralNetwork([784, 128, 64, 10])

print("\nTraining on MNIST...")
history = net.train(
    X_train, y_train,
    epochs=50,
    learning_rate=0.1,
    batch_size=64,
)

# Evaluate on test set
test_predictions = net.forward(X_test)
test_accuracy = np.mean(np.argmax(test_predictions, axis=1) == y_test)
print(f"\nTest accuracy: {test_accuracy:.4f}")
```

With this architecture and 50 epochs, expect around 95-97% test accuracy. That means your hand-built network correctly classifies about 96 out of every 100 handwritten digits.

### Visualize Predictions

```python
def show_predictions(net, X, y, n=10):
    """Show predictions alongside true labels."""
    predictions = net.forward(X[:n])
    predicted_labels = np.argmax(predictions, axis=1)

    fig, axes = plt.subplots(2, n, figsize=(n * 1.5, 3.5))
    for i in range(n):
        # Show the digit
        axes[0, i].imshow(X[i].reshape(28, 28), cmap="gray")
        color = "green" if predicted_labels[i] == y[i] else "red"
        axes[0, i].set_title(f"Pred: {predicted_labels[i]}", color=color, fontsize=9)
        axes[0, i].axis("off")

        # Show confidence bars
        axes[1, i].barh(range(10), predictions[i], color="steelblue")
        axes[1, i].set_yticks(range(10))
        axes[1, i].set_xlim(0, 1)
        axes[1, i].set_yticklabels(range(10), fontsize=7)
        axes[1, i].tick_params(axis='x', labelsize=6)

    plt.tight_layout()
    plt.savefig("predictions.png")
    plt.show()

show_predictions(net, X_test, y_test)
```

### Look at Mistakes

```python
def show_mistakes(net, X, y, n=10):
    """Show examples the network gets wrong."""
    predictions = net.forward(X)
    predicted_labels = np.argmax(predictions, axis=1)
    wrong = np.where(predicted_labels != y)[0]

    if len(wrong) == 0:
        print("No mistakes found!")
        return

    print(f"Total mistakes: {len(wrong)} out of {len(y)}")

    fig, axes = plt.subplots(1, min(n, len(wrong)), figsize=(n * 1.5, 2))
    if min(n, len(wrong)) == 1:
        axes = [axes]
    for ax, idx in zip(axes, wrong[:n]):
        ax.imshow(X[idx].reshape(28, 28), cmap="gray")
        ax.set_title(f"True: {y[idx]}, Pred: {predicted_labels[idx]}", fontsize=8, color="red")
        ax.axis("off")
    plt.tight_layout()
    plt.savefig("mistakes.png")
    plt.show()

show_mistakes(net, X_test, y_test)
```

Many mistakes will be on digits that are genuinely ambiguous -- sloppy handwriting where even a human might hesitate.

---

## Part 6: Experiments and Extensions (30 min)

### Experiment 1: Architecture Search

Try different network architectures and compare test accuracy:

```python
architectures = [
    [784, 32, 10],           # Small: 1 hidden layer, 32 neurons
    [784, 128, 10],          # Medium: 1 hidden layer, 128 neurons
    [784, 128, 64, 10],      # Deep: 2 hidden layers
    [784, 256, 128, 64, 10], # Deeper: 3 hidden layers
]

for arch in architectures:
    net = NeuralNetwork(arch)
    history = net.train(X_train, y_train, epochs=30, learning_rate=0.1, batch_size=64, verbose=False)
    test_pred = net.forward(X_test)
    test_acc = np.mean(np.argmax(test_pred, axis=1) == y_test)
    print(f"Architecture {arch}: test accuracy = {test_acc:.4f}")
```

Questions to discuss:
- Does deeper always mean better?
- What happens with very small hidden layers?
- At what point does adding more neurons stop helping?

### Experiment 2: Learning Rate

The learning rate controls how big each weight update step is. Too high and training is unstable. Too low and training is slow.

```python
learning_rates = [0.001, 0.01, 0.1, 0.5, 1.0]

plt.figure(figsize=(10, 5))
for lr in learning_rates:
    net = NeuralNetwork([784, 128, 64, 10])
    history = net.train(X_train, y_train, epochs=30, learning_rate=lr, batch_size=64, verbose=False)
    plt.plot(history["loss"], label=f"lr={lr}")

plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Effect of Learning Rate")
plt.legend()
plt.savefig("learning_rate_comparison.png")
plt.show()
```

### Extension: Add Momentum

Standard gradient descent updates weights using only the current gradient. Momentum adds a "velocity" term that accumulates past gradients, helping the optimizer move faster in consistent directions and dampen oscillations.

Modify the `Layer` class:

```python
class Layer:
    def __init__(self, input_size, output_size):
        self.weights = np.random.randn(input_size, output_size) * np.sqrt(2.0 / input_size)
        self.biases = np.zeros((1, output_size))
        self.input = None
        self.z = None
        # Momentum terms
        self.v_weights = np.zeros_like(self.weights)
        self.v_biases = np.zeros_like(self.biases)
```

Modify the weight update in `backward`:

```python
# With momentum (replace the simple update)
momentum = 0.9
layer.v_weights = momentum * layer.v_weights - learning_rate * grad_weights
layer.v_biases = momentum * layer.v_biases - learning_rate * grad_biases
layer.weights += layer.v_weights
layer.biases += layer.v_biases
```

Compare training with and without momentum.

---

## Part 7: Debrief (20 min)

### What You Built

Every component of a neural network, by hand:

| Component | What It Does | Framework Equivalent |
|---|---|---|
| `Layer` class | Stores weights, computes linear transform | `torch.nn.Linear` |
| `relu` / `softmax` | Activation functions | `torch.nn.ReLU`, `torch.nn.Softmax` |
| `forward` | Computes predictions from inputs | `model.forward()` or `model(x)` |
| `cross_entropy_loss` | Measures prediction error | `torch.nn.CrossEntropyLoss` |
| `backward` | Computes gradients via chain rule | `loss.backward()` (autograd) |
| `train` loop | Batch training with gradient descent | `optimizer.step()` in a training loop |

### What Frameworks Add

The code you wrote is functionally equivalent to what PyTorch does. Frameworks add:

- **Automatic differentiation** -- computes gradients automatically for any computation graph
- **GPU acceleration** -- runs matrix math on graphics cards for massive speedup
- **Optimizers** -- Adam, RMSprop, and others that adapt learning rates per-parameter
- **Pre-built layers** -- convolutions, attention, normalization, and more
- **Ecosystem** -- data loaders, pre-trained models, distributed training

But the core loop is identical: forward, loss, backward, update.

### Discussion Questions

- Why does ReLU work better than sigmoid for deep networks? (Hint: vanishing gradients)
- What would happen if we removed all activation functions?
- Why do we need mini-batches instead of using the full dataset each step?
- How would you modify this network to work on color images (3 channels)?

---

## Key Takeaways

- A neural network is a series of linear transformations with nonlinear activations
- Backpropagation is just the chain rule applied systematically from output to input
- Weight initialization, learning rate, and architecture all significantly affect training
- Understanding the math is not strictly necessary to use frameworks, but it makes you dramatically better at debugging and improving models

## Next Steps

- Implement a convolutional layer for better image classification
- Add dropout regularization to reduce overfitting
- Try the Adam optimizer instead of vanilla gradient descent
- Port your implementation to PyTorch and compare the code side by side
- Explore the "RAG from Scratch" and "Build an Agent" workshops for applied AI techniques
