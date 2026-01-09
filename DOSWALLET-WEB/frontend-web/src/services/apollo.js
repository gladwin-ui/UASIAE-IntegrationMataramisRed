import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const USER_SERVICE_URL = 'http://localhost:5001/graphql';
const WALLET_SERVICE_URL = 'http://localhost:5002/graphql';
const TRANSACTION_SERVICE_URL = 'http://localhost:5003/graphql';

// Read token synchronously from localStorage for web
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const userLink = createHttpLink({ uri: USER_SERVICE_URL });
const walletLink = createHttpLink({ uri: WALLET_SERVICE_URL });
const transactionLink = createHttpLink({ uri: TRANSACTION_SERVICE_URL });

export const client = new ApolloClient({
  link: authLink.concat(userLink),
  cache: new InMemoryCache(),
});

export const walletClient = new ApolloClient({
  link: authLink.concat(walletLink),
  cache: new InMemoryCache(),
});

export const transactionClient = new ApolloClient({
  link: authLink.concat(transactionLink),
  cache: new InMemoryCache(),
});
