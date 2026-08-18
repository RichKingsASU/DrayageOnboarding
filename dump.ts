import { INITIAL_ACCOUNTS, INITIAL_CONTACTS, INITIAL_LANES } from './src/mockData';

const data = {
  accounts: INITIAL_ACCOUNTS,
  contacts: INITIAL_CONTACTS,
  lanes: INITIAL_LANES
};

console.log(JSON.stringify(data, null, 2));
