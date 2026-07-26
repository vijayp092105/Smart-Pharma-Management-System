import torch
import time

print("=== GPU Performance Test ===")
print(f"CUDA Available: {torch.cuda.is_available()}")

if torch.cuda.is_available():
    device = torch.device("cuda")
    print(f"GPU Name: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
    
    # Test performance
    size = 10000
    a = torch.randn(size, size, device=device)
    b = torch.randn(size, size, device=device)
    
    start = time.time()
    c = torch.matmul(a, b)
    torch.cuda.synchronize()
    end = time.time()
    
    print(f"Matrix multiplication ({size}x{size}): {end-start:.4f} seconds")
else:
    print("No GPU available. Using CPU.")