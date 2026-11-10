function bbMockDelay(value) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), window.BB_CONFIG.MOCK_LATENCY_MS);
  });
}

function bbMockError(message, status = 400) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new BBApiError(message, status)), window.BB_CONFIG.MOCK_LATENCY_MS);
  });
}
