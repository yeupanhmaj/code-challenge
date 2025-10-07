const sum_to_n_a = function(n) {
    // Iterative approach using for loop
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

const sum_to_n_b = function(n) {
    // Mathematical formula approach: n * (n + 1) / 2
    return (n * (n + 1)) / 2;
};

const sum_to_n_c = function(n) {
    // Recursive approach with stack overflow protection
    if (n <= 0) {
        return 0;
    }
    if (n === 1) {
        return 1;
    }
    
    // Prevent stack overflow for large numbers
    if (n > 10000) {
        console.warn(`Warning: n=${n} is too large for recursive approach. Using iterative fallback.`);
        // Fallback to iterative approach for very large numbers
        let sum = 0;
        for (let i = 1; i <= n; i++) {
            sum += i;
        }
        return sum;
    }
    
    return n + sum_to_n_c(n - 1);
};

// Alternative: Tail-recursive approach (more stack-efficient)
const sum_to_n_c_optimized = function(n, accumulator = 0) {
    // Tail-recursive approach - more efficient for larger numbers
    if (n <= 0) {
        return accumulator;
    }
    
    // Still limit to prevent excessive recursion depth
    if (n > 50000) {
        console.warn(`Warning: n=${n} is too large for tail-recursive approach. Using mathematical formula.`);
        return accumulator + (n * (n + 1)) / 2;
    }
    
    return sum_to_n_c_optimized(n - 1, accumulator + n);
};

// Benchmark function to test performance and correctness
function benchmark() {
    console.log('=== Sum to N Benchmark Testing ===\n');
    
    // Test cases for correctness
    const testCases = [1, 5, 10, 100];
    
    console.log('--- Correctness Testing ---');
    testCases.forEach(n => {
        const resultA = sum_to_n_a(n);
        const resultB = sum_to_n_b(n);
        const resultC = sum_to_n_c(n);
        const resultC_opt = sum_to_n_c_optimized(n);
        
        const allMatch = resultA === resultB && resultB === resultC && resultC === resultC_opt;
        console.log(`n=${n}: A=${resultA}, B=${resultB}, C=${resultC}, C_opt=${resultC_opt} | Match: ${allMatch ? '✓' : '✗'}`);
    });
    
    console.log('\n--- Stack Overflow Protection Test ---');
    const largeNumbers = [15000, 25000];
    
    largeNumbers.forEach(n => {
        console.log(`\nTesting with large n=${n}:`);
        
        try {
            const startC = performance.now();
            const resultC = sum_to_n_c(n);
            const endC = performance.now();
            console.log(`  Method C (Protected): ${(endC - startC).toFixed(4)}ms | Result: ${resultC}`);
        } catch (error) {
            console.log(`  Method C (Protected): Error - ${error.message}`);
        }
        
        try {
            const startC_opt = performance.now();
            const resultC_opt = sum_to_n_c_optimized(n);
            const endC_opt = performance.now();
            console.log(`  Method C (Tail-Recursive): ${(endC_opt - startC_opt).toFixed(4)}ms | Result: ${resultC_opt}`);
        } catch (error) {
            console.log(`  Method C (Tail-Recursive): Error - ${error.message}`);
        }
        
        // Mathematical formula for comparison
        const startB = performance.now();
        const resultB = sum_to_n_b(n);
        const endB = performance.now();
        console.log(`  Method B (Formula): ${(endB - startB).toFixed(4)}ms | Result: ${resultB}`);
    });
    
    console.log('\n--- Performance Testing (Safe Numbers) ---');
    
    // Performance test with safe input sizes
    const performanceTests = [100, 1000];
    
    performanceTests.forEach(n => {
        console.log(`\nTesting with n=${n}:`);
        
        // Test Method A (Iterative)
        const startA = performance.now();
        const resultA = sum_to_n_a(n);
        const endA = performance.now();
        console.log(`  Method A (Iterative): ${(endA - startA).toFixed(4)}ms | Result: ${resultA}`);
        
        // Test Method B (Formula)
        const startB = performance.now();
        const resultB = sum_to_n_b(n);
        const endB = performance.now();
        console.log(`  Method B (Formula):   ${(endB - startB).toFixed(4)}ms | Result: ${resultB}`);
        
        // Test Method C (Recursive)
        const startC = performance.now();
        const resultC = sum_to_n_c(n);
        const endC = performance.now();
        console.log(`  Method C (Recursive): ${(endC - startC).toFixed(4)}ms | Result: ${resultC}`);
        
        // Test Method C Optimized (Tail-Recursive)
        const startC_opt = performance.now();
        const resultC_opt = sum_to_n_c_optimized(n);
        const endC_opt = performance.now();
        console.log(`  Method C (Tail-Recursive): ${(endC_opt - startC_opt).toFixed(4)}ms | Result: ${resultC_opt}`);
    });
    
    console.log('\n=== Benchmark Complete ===');
}

// Run the benchmark
benchmark();