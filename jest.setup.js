// Silence React Router deprecation warnings in tests
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Filter out specific React Router deprecation warnings
  if (args[0] && typeof args[0] === 'string') {
    const suppressPatterns = [
      'UNSAFE_useNavigate',
      'UNSAFE_NavigationContext',
      'useLoaderData without using RouterProvider',
      'logV6DeprecationWarnings'
    ];
    
    for (const pattern of suppressPatterns) {
      if (args[0].includes(pattern)) {
        return; // Don't log this warning
      }
    }
  }
  
  // Log all other warnings as usual
  originalConsoleWarn(...args);
};