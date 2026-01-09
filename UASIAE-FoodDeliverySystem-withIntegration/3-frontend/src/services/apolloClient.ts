import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const API_BASE_URL = 'http://localhost:4000/api';

// Create HTTP links for different services
const createServiceLink = (service: string) => {
    return createHttpLink({
        uri: `${API_BASE_URL}/graphql/${service}`,
    });
};

// Auth link to add token to requests
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            ...headers,
            authorization: token ? `Bearer ${token}` : "",
        }
    };
});

// Create clients for each service
export const userClient = new ApolloClient({
    link: from([authLink, createServiceLink('user')]),
    cache: new InMemoryCache(),
});

export const orderClient = new ApolloClient({
    link: from([authLink, createServiceLink('order')]),
    cache: new InMemoryCache(),
});

export const paymentClient = new ApolloClient({
    link: from([authLink, createServiceLink('payment')]),
    cache: new InMemoryCache(),
});

export const restaurantClient = new ApolloClient({
    link: from([authLink, createServiceLink('restaurant')]),
    cache: new InMemoryCache(),
});

// Default client (user service)
export const apolloClient = userClient;
