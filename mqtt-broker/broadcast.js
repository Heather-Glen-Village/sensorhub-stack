export function broadcastToClients(wss, data, userFilterFn = () => true) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN && client.user && userFilterFn(client.user)) {
      const filteredData = client.user.username === 'masterscreen'
        ? data
        : data.filter(row => row.user_id === client.user.id);

      client.send(JSON.stringify(filteredData));
    }
  });
}
