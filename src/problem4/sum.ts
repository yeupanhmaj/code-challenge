// Type definitions
type SumFunction = (n: number) => number;
type OptimizedSumFunction = (n: number, accumulator?: number) => number;

interface BenchmarkResult {
    method: string;
    time: number;
    result: number;
    error?: string;
}

interface TestCase {
    input: number;
    expected?: number;
}

const sum_to_n_a: SumFunction = function(n: number): number {
    // Input validation
    if (!Number.isInteger(n) || n < 0) {
        throw new Error('Input must be a non-negative integer');
    }
    
    // Iterative approach using for loop
    let sum: number = 0;
    for (let i: number = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

const sum_to_n_b: SumFunction = function(n: number): number {
    // Input validation
    if (!Number.isInteger(n) || n < 0) {
        throw new Error('Input must be a non-negative integer');
    }
    
    // Mathematical formula approach: n * (n + 1) / 2
    return (n * (n + 1)) / 2;
};

const sum_to_n_c: SumFunction = function(n: number): number {
    // Input validation
    if (!Number.isInteger(n) || n < 0) {
        throw new Error('Input must be a non-negative integer');
    }
    
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
        let sum: number = 0;
        for (let i: number = 1; i <= n; i++) {
            sum += i;
        }
        return sum;
    }
    
    return n + sum_to_n_c(n - 1);
};

// Alternative: Tail-recursive approach (more stack-efficient)
const sum_to_n_c_optimized: OptimizedSumFunction = function(n: number, accumulator: number = 0): number {
    // Input validation
    if (!Number.isInteger(n) || n < 0) {
        throw new Error('Input must be a non-negative integer');
    }
    if (!Number.isInteger(accumulator) || accumulator < 0) {
        throw new Error('Accumulator must be a non-negative integer');
    }
    
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

// Performance measurement helper
function measurePerformance<T>(fn: () => T, label: string): BenchmarkResult {
    try {
        const start: number = performance.now();
        const result: T = fn();
        const end: number = performance.now();
        
        return {
            method: label,
            time: end - start,
            result: result as number,
        };
    } catch (error) {
        return {
            method: label,
            time: 0,
            result: 0,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

// Benchmark function to test performance and correctness
function benchmark(): void {
    console.log('=== Sum to N Benchmark Testing (TypeScript) ===\n');
    
    // Test cases for correctness
    const testCases: TestCase[] = [
        { input: 1, expected: 1 },
        { input: 5, expected: 15 },
        { input: 10, expected: 55 },
        { input: 100, expected: 5050 }
    ];
    
    console.log('--- Correctness Testing ---');
    testCases.forEach((testCase: TestCase) => {
        const n: number = testCase.input;
        
        try {
            const resultA: number = sum_to_n_a(n);
            const resultB: number = sum_to_n_b(n);
            const resultC: number = sum_to_n_c(n);
            const resultC_opt: number = sum_to_n_c_optimized(n);
            
            const allMatch: boolean = resultA === resultB && resultB === resultC && resultC === resultC_opt;
            const expectedMatch: boolean = testCase.expected ? resultA === testCase.expected : true;
            
            console.log(`n=${n}: A=${resultA}, B=${resultB}, C=${resultC}, C_opt=${resultC_opt} | Match: ${allMatch ? '✓' : '✗'} | Expected: ${expectedMatch ? '✓' : '✗'}`);
        } catch (error) {
            console.log(`n=${n}: Error - ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    
    console.log('\n--- Stack Overflow Protection Test ---');
    const largeNumbers: number[] = [15000, 25000];
    
    largeNumbers.forEach((n: number) => {
        console.log(`\nTesting with large n=${n}:`);
        
        const results: BenchmarkResult[] = [
            measurePerformance(() => sum_to_n_c(n), 'Method C (Protected)'),
            measurePerformance(() => sum_to_n_c_optimized(n), 'Method C (Tail-Recursive)'),
            measurePerformance(() => sum_to_n_b(n), 'Method B (Formula)')
        ];
        
        results.forEach((result: BenchmarkResult) => {
            if (result.error) {
                console.log(`  ${result.method}: Error - ${result.error}`);
            } else {
                console.log(`  ${result.method}: ${result.time.toFixed(4)}ms | Result: ${result.result}`);
            }
        });
    });
    
    console.log('\n--- Performance Testing (Safe Numbers) ---');
    
    // Performance test with safe input sizes
    const performanceTests: number[] = [100, 1000];
    
    performanceTests.forEach((n: number) => {
        console.log(`\nTesting with n=${n}:`);
        
        const methods: Array<{ fn: () => number; label: string }> = [
            { fn: () => sum_to_n_a(n), label: 'Method A (Iterative)' },
            { fn: () => sum_to_n_b(n), label: 'Method B (Formula)' },
            { fn: () => sum_to_n_c(n), label: 'Method C (Recursive)' },
            { fn: () => sum_to_n_c_optimized(n), label: 'Method C (Tail-Recursive)' }
        ];
        
        methods.forEach(({ fn, label }) => {
            const result: BenchmarkResult = measurePerformance(fn, label);
            if (result.error) {
                console.log(`  ${label}: Error - ${result.error}`);
            } else {
                console.log(`  ${label}: ${result.time.toFixed(4)}ms | Result: ${result.result}`);
            }
        });
    });
    
    console.log('\n--- Type Safety Demo ---');
    console.log('Testing with invalid inputs:');
    
    const invalidInputs: any[] = [-5, 1.5, 'string', null, undefined];
    
    invalidInputs.forEach((input: any) => {
        try {
            const result: number = sum_to_n_a(input);
            console.log(`  Input ${JSON.stringify(input)}: ${result}`);
        } catch (error) {
            console.log(`  Input ${JSON.stringify(input)}: Error - ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    
    console.log('\n=== Benchmark Complete ===');
}

// Export functions for external use
export {
    sum_to_n_a,
    sum_to_n_b,
    sum_to_n_c,
    sum_to_n_c_optimized,
    benchmark,
    type SumFunction,
    type OptimizedSumFunction,
    type BenchmarkResult,
    type TestCase
};

// Run the benchmark if this file is executed directly
// Check if running in Node.js environment
declare const process: any;
if (typeof process !== 'undefined' && process.argv && process.argv[1] && process.argv[1].includes('sum.ts')) {
    benchmark();
}