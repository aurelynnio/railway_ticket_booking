// =============================================================================
// MongoDB Replica Set Init Script
// Runs once via mongo-init container to initiate the replica set.
// Required by tickets-service for $transaction support.
// =============================================================================

try {
  const status = rs.status();
  if (status.ok === 1) {
    print('Replica set already initiated: ' + JSON.stringify(status.members.map(m => m.name)));
    quit(0);
  }
} catch (e) {
  print('Replica set not yet initiated, initiating now...');
}

const config = {
  _id: 'rs0',
  members: [
    {
      _id: 0,
      host: 'mongodb:27017',
      priority: 1,
    },
  ],
};

try {
  const result = rs.initiate(config);
  print('Replica set initiated: ' + JSON.stringify(result));

  // Wait for primary to be elected
  let attempts = 0;
  while (attempts < 30) {
    try {
      const status = rs.status();
      const primary = status.members.find(m => m.stateStr === 'PRIMARY');
      if (primary) {
        print('Primary elected: ' + primary.name);
        quit(0);
      }
    } catch (e) {
      // rs.status() may fail during transition
    }
    sleep(1000);
    attempts++;
  }
  print('WARNING: Primary not elected after 30s. Check MongoDB logs.');
  quit(1);
} catch (e) {
  print('Failed to initiate replica set: ' + e.message);
  quit(1);
}
