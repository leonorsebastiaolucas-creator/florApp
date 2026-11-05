export async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Pedido falhou (${response.status}): ${response.statusText}`);
  }

  return response;
}
