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
    // Using Array and Reduce
    return Array.from({ length: n }, (_, i) => i + 1).reduce((acc, curr) => acc + curr, 0);
};

// Benchmark function to test performance and correctness
function benchmark() {
    console.log('=== Sum to N Benchmark Testing ===\n');
    
    // Test cases for correctness
    const testCases = [1, 5, 10];
    
    console.log('--- Correctness Testing ---');
    testCases.forEach(n => {
        const resultA = sum_to_n_a(n);
        const resultB = sum_to_n_b(n);
        const resultC = sum_to_n_c(n);
        
        const allMatch = resultA === resultB && resultB === resultC;
        console.log(`n=${n}: A=${resultA}, B=${resultB}, C=${resultC} | Match: ${allMatch ? '✓' : '✗'}`);
    });
    
    console.log('\n--- Performance Testing ---');
    
    // Performance test with different input sizes
    const performanceTests = [100];
    
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
        
        // Test Method C (Recursive) - with safety check for large n
        if (n <= 10000) { // Avoid stack overflow for very large n
            const startC = performance.now();
            const resultC = sum_to_n_c(n);
            const endC = performance.now();
            console.log(`  Method C (Using Array and Reduce): ${(endC - startC).toFixed(4)}ms | Result: ${resultC}`);
        } else {
            console.log(`  Method C (Using Array and Reduce): Skipped (risk of stack overflow)`);
        }
    });
    
    console.log('\n--- Multiple Iterations Performance Test ---');
    const iterations = 10000;
    const testN = 100;
    
    console.log(`Running each method ${iterations} times with n=${testN}:`);
    
    // Method A benchmark
    const startIterA = performance.now();
    for (let i = 0; i < iterations; i++) {
        sum_to_n_a(testN);
    }
    const endIterA = performance.now();
    console.log(`  Method A (Iterative): ${(endIterA - startIterA).toFixed(4)}ms total, ${((endIterA - startIterA) / iterations).toFixed(6)}ms avg`);
    
    // Method B benchmark
    const startIterB = performance.now();
    for (let i = 0; i < iterations; i++) {
        sum_to_n_b(testN);
    }
    const endIterB = performance.now();
    console.log(`  Method B (Formula):   ${(endIterB - startIterB).toFixed(4)}ms total, ${((endIterB - startIterB) / iterations).toFixed(6)}ms avg`);
    
    // Method C benchmark
    const startIterC = performance.now();
    for (let i = 0; i < iterations; i++) {
        sum_to_n_c(testN);
    }
    const endIterC = performance.now();
    console.log(`  Method C (Using Array and Reduce): ${(endIterC - startIterC).toFixed(4)}ms total, ${((endIterC - startIterC) / iterations).toFixed(6)}ms avg`);
    
    console.log('\n=== Benchmark Complete ===');
}

// Run the benchmark
benchmark();